export type MedalAdditionalTrait = {
  stars: 1 | 2 | 3;
  content: string;
  drawRate: number;
};

export type Medal = {
  id: string;
  name: string;
  imageUrl: string;
  uniqueTrait: string;
  medalTags: string[];
  additionalTraits: [MedalAdditionalTrait[], MedalAdditionalTrait[], MedalAdditionalTrait[]];
  active?: boolean;
};

export type MedalTag = {
  id: string;
  name: string;
  effect: string;
  active?: boolean;
};

export const emptyAdditionalTrait = (): MedalAdditionalTrait => ({
  stars: 1,
  content: "",
  drawRate: 0,
});

export const emptyAdditionalTraits = (): Medal["additionalTraits"] => [
  [],
  [],
  [],
];
