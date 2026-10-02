export type MedalDrawRate = {
  stars: 1 | 2 | 3;
  content: string;
  probability: number;
};

export type Medal = {
  id: string;
  name: string;
  imageUrl: string;
  uniqueTrait: string;
  tagEffect: string;
  medalTags: string[];
  additionalTraits: [string, string, string];
  drawRates: MedalDrawRate[];
  active?: boolean;
};

export type MedalTag = {
  id: string;
  name: string;
  twoSetEffect: string;
  threeSetEffect: string;
  effect?: string;
  active?: boolean;
};

export const emptyDrawRate = (): MedalDrawRate => ({
  stars: 1,
  content: "",
  probability: 0,
});

export const emptyAdditionalTraits = (): Medal["additionalTraits"] => [
  "",
  "",
  "",
];
