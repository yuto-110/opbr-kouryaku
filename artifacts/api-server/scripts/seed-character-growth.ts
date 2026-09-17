import {
  connectDB,
  disconnectDB,
  CharacterGrowthRule,
  CharacterUnlockRule,
} from "@workspace/db";

async function main() {
  await connectDB();

  // ★ごとの最大レベル
  const growthRules = [
    {
      stars: 2,
      maxLevel: 20,
    },
    {
      stars: 3,
      maxLevel: 40,
    },
    {
      stars: 4,
      maxLevel: 60,
      upgradeCostToNext: 400,
    },
    {
      stars: 5,
      maxLevel: 80,
      upgradeCostToNext: 800,
    },
    {
      stars: 6,
      maxLevel: 100,
    },
  ];

  // 初期★ごとのキャラ解放に必要なかけら
  // 現時点で判明しているものだけ登録する
  const unlockRules = [
    {
      initialStars: 4,
      unlockFragments: 500,
    },
  ];

  for (const rule of growthRules) {
    await CharacterGrowthRule.updateOne(
      { stars: rule.stars },
      { $set: rule },
      { upsert: true },
    );
  }

  for (const rule of unlockRules) {
    await CharacterUnlockRule.updateOne(
      { initialStars: rule.initialStars },
      { $set: rule },
      { upsert: true },
    );
  }

  console.log("Character growth rules seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });