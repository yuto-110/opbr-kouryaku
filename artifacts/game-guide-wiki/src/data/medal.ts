export type MedalAdditionalTrait = {
  content: string;
  drawRate: string;
  unlockCondition: string;
};

export type Medal = {
  id: string;
  name: string;
  imageUrl: string;
  uniqueTrait: string;
  medalTags: string[];
  additionalTraits: [MedalAdditionalTrait, MedalAdditionalTrait, MedalAdditionalTrait];
  active?: boolean;
};

export type MedalTag = {
  id: string;
  name: string;
  effect: string;
  active?: boolean;
};

export const emptyAdditionalTrait = (): MedalAdditionalTrait => ({
  content: "",
  drawRate: "",
  unlockCondition: "",
});

export const emptyAdditionalTraits = (): Medal["additionalTraits"] => [
  emptyAdditionalTrait(),
  emptyAdditionalTrait(),
  emptyAdditionalTrait(),
];
