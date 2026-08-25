import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber, twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import * as schema from ".";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("Better Auth 1.7.1 schema compatibility", () => {
  it("creates and reads mapped person, account, and session rows", async () => {
    if (!databaseUrl)
      throw new Error("DATABASE_URL is required for this integration test");

    const client = postgres(databaseUrl, { max: 1, prepare: false });
    const database = drizzle(client, { schema, casing: "snake_case" });
    const email = `auth0-${randomUUID()}@staff.invalid`;
    const password = "AUTH0-only-schema-probe-password-123!";
    const auth = betterAuth({
      secret: "auth0-schema-compatibility-test-secret",
      baseURL: "http://127.0.0.1:3000",
      database: drizzleAdapter(database, {
        provider: "pg",
        schema,
      }),
      advanced: {
        database: {
          generateId: false,
        },
      },
      emailAndPassword: {
        enabled: true,
      },
      user: {
        modelName: "person",
        fields: {
          name: "displayName",
        },
      },
      session: {
        modelName: "authSession",
        fields: {
          userId: "personId",
        },
      },
      account: {
        modelName: "authAccount",
        fields: {
          userId: "personId",
        },
      },
      verification: {
        modelName: "authVerification",
      },
      plugins: [
        phoneNumber({
          sendOTP: async () => undefined,
          schema: {
            user: {
              fields: {
                phoneNumber: "phone",
                phoneNumberVerified: "phoneVerified",
              },
            },
          },
        }),
        twoFactor({
          twoFactorTable: "authTwoFactor",
          schema: {
            user: {
              fields: {
                twoFactorEnabled: "twoFactorEnabled",
              },
            },
            twoFactor: {
              fields: {
                userId: "personId",
              },
            },
          },
        }),
      ],
    });

    try {
      const response = await auth.handler(
        new Request("http://127.0.0.1:3000/api/auth/sign-up/email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            name: "AUTH0 schema probe",
            password,
          }),
        }),
      );

      expect(response.status).toBe(200);

      const [createdPerson] = await database
        .select()
        .from(schema.person)
        .where(eq(schema.person.email, email));
      expect(createdPerson?.displayName).toBe("AUTH0 schema probe");

      const accounts = createdPerson
        ? await database
            .select()
            .from(schema.authAccount)
            .where(eq(schema.authAccount.personId, createdPerson.id))
        : [];
      expect(accounts).toHaveLength(1);
      expect(accounts[0]?.issuer).toBe("local:credential");
      expect(accounts[0]?.providerId).toBe("credential");

      const sessions = createdPerson
        ? await database
            .select()
            .from(schema.authSession)
            .where(eq(schema.authSession.personId, createdPerson.id))
        : [];
      expect(sessions).toHaveLength(1);

      const cookie = response.headers.get("set-cookie")?.split(";")[0];
      expect(cookie).toBeTruthy();
      if (!cookie || !createdPerson) return;

      const enableTwoFactorResponse = await auth.handler(
        new Request("http://127.0.0.1:3000/api/auth/two-factor/enable", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie,
          },
          body: JSON.stringify({ password }),
        }),
      );
      expect(enableTwoFactorResponse.status).toBe(200);

      const twoFactorRows = await database
        .select()
        .from(schema.authTwoFactor)
        .where(eq(schema.authTwoFactor.personId, createdPerson.id));
      expect(twoFactorRows).toHaveLength(1);
      expect(twoFactorRows[0]?.secret).toBeTruthy();
      expect(twoFactorRows[0]?.backupCodes).toBeTruthy();
    } finally {
      await database
        .delete(schema.person)
        .where(eq(schema.person.email, email));
      await client.end({ timeout: 5 });
    }
  });
});
