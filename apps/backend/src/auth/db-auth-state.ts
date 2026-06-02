import {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
  proto,
} from '@whiskeysockets/baileys';
import { prisma } from '../prisma';

type KeyType = keyof SignalDataTypeMap;

/**
 * Drop-in replacement for Baileys' useMultiFileAuthState that stores
 * credentials and signal keys in PostgreSQL instead of the local filesystem.
 *
 * Benefits over file-based storage:
 *  - Sessions survive server restarts and deploys on any platform
 *  - Works on platforms with ephemeral filesystems (Render free tier, etc.)
 *  - Sessions are backed up as part of normal database backups
 */
export async function useDbAuthState(businessId: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const sessionRow = await prisma.session.findUnique({ where: { businessId } });

  const creds: AuthenticationCreds = sessionRow?.creds
    ? JSON.parse(JSON.stringify(sessionRow.creds), BufferJSON.reviver)
    : initAuthCreds();

  const saveCreds = async () => {
    const credsData = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
    await prisma.session.upsert({
      where: { businessId },
      create: { businessId, status: 'DISCONNECTED', creds: credsData },
      update: { creds: credsData },
    });
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async <T extends KeyType>(type: T, ids: string[]) => {
        const rows = await prisma.sessionKey.findMany({
          where: { businessId, keyType: type, keyId: { in: ids } },
        });

        const result: { [id: string]: SignalDataTypeMap[T] } = {};
        for (const row of rows) {
          let val = JSON.parse(
            JSON.stringify(row.keyData),
            BufferJSON.reviver,
          ) as SignalDataTypeMap[T];

          if (type === 'app-state-sync-key' && val) {
            val = proto.Message.AppStateSyncKeyData.fromObject(val as any) as unknown as SignalDataTypeMap[T];
          }
          result[row.keyId] = val;
        }
        return result;
      },

      set: async (data: { [T in KeyType]?: { [id: string]: SignalDataTypeMap[T] | null } }) => {
        const ops: ReturnType<typeof prisma.sessionKey.upsert | typeof prisma.sessionKey.deleteMany>[] = [];

        for (const [type, keyMap] of Object.entries(data) as [KeyType, any][]) {
          if (!keyMap) continue;
          for (const [id, value] of Object.entries(keyMap)) {
            if (value != null) {
              ops.push(
                prisma.sessionKey.upsert({
                  where: {
                    businessId_keyType_keyId: { businessId, keyType: type, keyId: id },
                  },
                  create: {
                    businessId,
                    keyType: type,
                    keyId: id,
                    keyData: JSON.parse(JSON.stringify(value, BufferJSON.replacer)),
                  },
                  update: {
                    keyData: JSON.parse(JSON.stringify(value, BufferJSON.replacer)),
                  },
                }),
              );
            } else {
              ops.push(
                prisma.sessionKey.deleteMany({
                  where: { businessId, keyType: type, keyId: id },
                }),
              );
            }
          }
        }

        if (ops.length) {
          await prisma.$transaction(ops as any);
        }
      },
    },
  };

  return { state, saveCreds };
}
