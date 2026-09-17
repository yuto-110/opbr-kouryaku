import {
  Character,
  connectDB,
  disconnectDB,
} from "@workspace/db";

async function main() {
  await connectDB();

  const character = {
    id: "test-character",
    name: "テストキャラクター",
    reading: "てすときゃらくたー",

    attribute: {
      base: "赤",
      changesTo: [],
    },

    role: {
      base: "アタッカー",
      changesTo: [],
    },

    rarity: "レジェンダリー",
    initialStars: 4,

    stats: {
      levelStats: [
        {
          level: 1,
          totalPower: 1000,
          hp: 1000,
          attack: 100,
          defense: 100,
          critical: 0,
        },
      ],

      level100Overboost: {
        totalPower: 11316,
        hp: 9336,
        attack: 1961,
        defense: 2425,
        critical: 11,
      },
    },

    description: "API動作確認用のテストキャラクター",

    skills: [
      {
        name: "テストスキル",
        description: "API動作確認用",
        cooldown: 10,
      },
    ],

    traits: [
      {
        name: "テスト特性",
        effect: "API動作確認用",
      },
    ],

    characterTypes: [],

    teamBoost: "回復ブースト",

    tier: "SS",

    strengths: ["テスト用"],
    weaknesses: ["テスト用"],

    recommendedMedals: [],
    relatedCharacters: [],
  };

  await Character.updateOne(
    { id: character.id },
    { $set: character },
    { upsert: true },
  );

  console.log("Test character seeded successfully.");
  console.log(`Character ID: ${character.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });