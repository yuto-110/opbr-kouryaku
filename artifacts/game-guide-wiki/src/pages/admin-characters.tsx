import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

const ACCESS_TOKEN_KEY = "opbr_access_token";

/* ============================================================
 * Master Data
 * ============================================================ */

const ATTRIBUTE_OPTIONS = ["赤", "青", "緑", "黒", "白"] as const;

const ROLE_OPTIONS = [
  "アタッカー",
  "ゲッター",
  "ディフェンダー",
] as const;

const RARITY_OPTIONS = [
  "超レジェンダリー",
  "レジェンダリー",
  "恒常",
  "配布",
  "コーラ",
] as const;

const STAR_OPTIONS = [2, 3, 4] as const;

const TIER_OPTIONS = [
  "SS",
  "S+",
  "S",
  "A+",
  "A",
  "B+",
  "B",
  "圏外",
  "評価中",
] as const;

/*
 * キャラタグ
 *
 * 後でサポート編成・検索・絞り込みに使用する。
 * タグを増やしたい場合はここに追加するだけでOK。
 */
const CHARACTER_TAG_OPTIONS = [
  "攻撃力増加",
  "攻撃力減少",
  "防御力増加",
  "防御力減少",
  "防御力無視",
  "ダメージ減少無視",
  "回復",
  "無敵",
  "よろけ無効",
  "ふっとばし",
  "引き寄せ",
  "クールタイム短縮",
  "クールタイム増加",
  "回避性能強化",
  "通常攻撃強化",
  "スキル強化",
  "状態異常無効",
  "状態異常解除",
  "状態異常付与",
  "旗奪取",
  "旗防衛",
  "お宝ゲージ回復",
  "体力回復",
  "味方強化",
  "敵弱体化",
  "敵撃破時強化",
  "復活",
  "耐久型",
  "火力型",
  "サポート型",
] as const;

/*
 * スキルタイプ
 */
const SKILL_TYPE_OPTIONS = [
  "通常",
  "ダブルキャラ",
  "スタイルチェンジ",
  "EVスキル",
  "コンボスキル",
  "奪取中カウンタースキル",
] as const;

/*
 * スキル効果タグ
 */
const SKILL_EFFECT_TAG_OPTIONS = [
  "攻撃力増加",
  "攻撃力減少",
  "防御力増加",
  "防御力減少",
  "防御力無視",
  "ダメージ減少無視",
  "回復",
  "無敵",
  "よろけ無効",
  "ふっとばし",
  "引き寄せ",
  "クールタイム短縮",
  "クールタイム増加",
  "回避性能強化",
  "通常攻撃強化",
  "スキル強化",
  "状態異常無効",
  "状態異常解除",
  "旗奪取補助",
  "旗防衛補助",
  "お宝ゲージ回復",
  "体力回復",
  "味方強化",
  "敵弱体化",
  "敵撃破時強化",
  "復活",
] as const;

/*
 * 状態異常タグ
 */
const STATUS_AILMENT_OPTIONS = [
  "気絶",
  "燃焼",
  "凍結",
  "感電",
  "毒",
  "魅了",
  "混乱",
  "石化",
  "振動",
  "お宝奪取不可",
  "回避不可",
  "スキル使用不可",
  "攻撃力減少",
  "防御力減少",
  "移動速度減少",
] as const;

/*
 * 特性枠
 */
const TRAIT_SLOT_OPTIONS = [
  "キャラ特性",
  "スタイル特性",
  "特性1",
  "特性2",
  "ブースト特性",
  "その他",
] as const;

type SkillType = (typeof SKILL_TYPE_OPTIONS)[number];
type CharacterTag = (typeof CHARACTER_TAG_OPTIONS)[number];
type SkillEffectTag = (typeof SKILL_EFFECT_TAG_OPTIONS)[number];
type StatusAilment = (typeof STATUS_AILMENT_OPTIONS)[number];
type TraitSlot = (typeof TRAIT_SLOT_OPTIONS)[number];

/* ============================================================
 * API Types
 * ============================================================ */

type Character = {
  id: string;
  name: string;
  reading?: string;
  faction?: string;
  description?: string;

  tags?: string[];

  attribute: {
    base: string;
    changesTo?: string[];
  };

  role: {
    base: string;
    changesTo?: string[];
  };

  rarity: string;
  initialStars: number;

  stats: {
    levelStats: Array<{
      level: number;
      totalPower: number;
      hp: number;
      attack: number;
      defense: number;
      critical: number;
    }>;

    level100Overboost?: {
      totalPower: number;
      hp: number;
      attack: number;
      defense: number;
      critical: number;
    };
  };

  skills?: Array<{
    skillType?: SkillType;
    name: string;
    description: string;
    power?: number;
    cooldown?: number;
    damageReductionIgnore?: boolean;
    defenseIgnore?: boolean;
    statusAilment?: string;
    duration?: number;
    extraEffects?: string[];
    effectTags?: string[];
    statusAilments?: string[];
  }>;

  traits?: Array<{
    slot: TraitSlot;
    name?: string;
    effect: string;
  }>;

  characterTypes?: Array<{
    typeId: string;
    name: string;
    effect: string;
  }>;

  teamBoost?: {
    boostId: string;
    name: string;
    effect: string;
    iconUrl?: string;
  };

  tier: string;
  imageUrl?: string;

  strengths?: string[];
  weaknesses?: string[];
  recommendedMedals?: string[];
  relatedCharacters?: string[];
};

type StatRow = {
  level: string;
  totalPower: string;
  hp: string;
  attack: string;
  defense: string;
  critical: string;
};

type SkillForm = {
  skillType: SkillType;
  name: string;
  description: string;
  power: string;
  cooldown: string;
  effectTags: string[];
  statusAilments: string[];
  duration: string;
  extraEffects: string[];
  changeFromSkillIndex: string;
  changeCondition: "" | "一定時間" | "コンボ成立時" | "奪取中" | "条件達成時";
  changeDuration: string;
};

type TraitForm = {
  slot: TraitSlot;
  target: string;
  traitName: string;
  effect: string;
};

type CharacterTypeForm = {
  typeId: string;
  name: string;
  effect: string;
};

type TeamBoostForm = {
  boostId: string;
  name: string;
  effect: string;
  iconUrl: string;
};

type FormState = {
  name: string;
  description: string;

  tags: string[];

  attributeBase: string;
  roleBase: string;
  rarity: string;
  initialStars: string;
  tier: string;

  imageUrl: string;

  stats: StatRow[];
  overboostEnabled: boolean;
  overboost: StatRow;

  skills: SkillForm[];
  traits: TraitForm[];
  characterTypes: CharacterTypeForm[];

  teamBoostEnabled: boolean;
  teamBoost: TeamBoostForm;

  strengths: string[];
  weaknesses: string[];
  recommendedMedals: string[];
  relatedCharacters: string[];
};

function emptyStatRow(level = ""): StatRow {
  return {
    level,
    totalPower: "",
    hp: "",
    attack: "",
    defense: "",
    critical: "",
  };
}

function emptySkill(): SkillForm {
  return {
    skillType: "通常",
    name: "",
    description: "",
    power: "",
    cooldown: "",
    effectTags: [],
    statusAilments: [],
    duration: "",
    extraEffects: [],
    changeFromSkillIndex: "",
    changeCondition: "",
    changeDuration: "",
  };
}

function emptyTrait(): TraitForm {
  return {
    slot: "キャラ特性",
    target: "共通",
    traitName: "",
    effect: "",
  };
}

function emptyCharacterType(): CharacterTypeForm {
  return {
    typeId: "",
    name: "",
    effect: "",
  };
}

function emptyTeamBoost(): TeamBoostForm {
  return {
    boostId: "",
    name: "",
    effect: "",
    iconUrl: "",
  };
}

function makeForm(character?: Character): FormState {
  return {
    name: character?.name ?? "",
    description: character?.description ?? "",

    tags: character?.tags ?? [],

    attributeBase: character?.attribute?.base ?? "赤",
    roleBase: character?.role?.base ?? "アタッカー",
    rarity: character?.rarity ?? "レジェンダリー",
    initialStars: String(character?.initialStars ?? 4),
    tier: character?.tier ?? "評価中",

    imageUrl: character?.imageUrl ?? "",

    stats:
      character?.stats?.levelStats?.map((stat) => ({
        level: String(stat.level),
        totalPower: String(stat.totalPower),
        hp: String(stat.hp),
        attack: String(stat.attack),
        defense: String(stat.defense),
        critical: String(stat.critical),
      })) ?? [emptyStatRow("1"), emptyStatRow("100")],

    overboostEnabled: Boolean(character?.stats?.level100Overboost),

    overboost: character?.stats?.level100Overboost
      ? {
          level: "100+",
          totalPower: String(
            character.stats.level100Overboost.totalPower,
          ),
          hp: String(character.stats.level100Overboost.hp),
          attack: String(character.stats.level100Overboost.attack),
          defense: String(character.stats.level100Overboost.defense),
          critical: String(character.stats.level100Overboost.critical),
        }
      : emptyStatRow(),

    skills:
      character?.skills?.map((skill) => ({
        skillType: skill.skillType ?? "通常",
        name: skill.name ?? "",
        description: skill.description ?? "",
        power:
          skill.power === undefined ? "" : String(skill.power),
        cooldown:
          skill.cooldown === undefined
            ? ""
            : String(skill.cooldown),

        effectTags:
          skill.effectTags ??
          [
            ...(skill.defenseIgnore
              ? ["防御力無視"]
              : []),
            ...(skill.damageReductionIgnore
              ? ["ダメージ減少無視"]
              : []),
          ],

        statusAilments:
          skill.statusAilments ??
          (skill.statusAilment
            ? [skill.statusAilment]
            : []),

        duration:
          skill.duration === undefined
            ? ""
            : String(skill.duration),

        extraEffects: skill.extraEffects ?? [],
        changeFromSkillIndex:
          skill.changeFromSkillIndex === undefined
            ? ""
            : String(skill.changeFromSkillIndex),
        changeCondition: skill.changeCondition ?? "",
        changeDuration:
          skill.changeDuration === undefined
            ? ""
            : String(skill.changeDuration),
      })) ?? [],

    traits:
      character?.traits?.map((trait) => ({
        slot: trait.slot ?? "キャラ特性",
        target: trait.target ?? "共通",
        traitName: trait.traitName ?? trait.name ?? "",
        effect: trait.effect ?? "",
      })) ?? [],

    characterTypes:
      character?.characterTypes?.map((type) => ({
        typeId: type.typeId ?? "",
        name: type.name ?? "",
        effect: type.effect ?? "",
      })) ?? [],

    teamBoostEnabled: Boolean(character?.teamBoost),

    teamBoost: character?.teamBoost
      ? {
          boostId: character.teamBoost.boostId ?? "",
          name: character.teamBoost.name ?? "",
          effect: character.teamBoost.effect ?? "",
          iconUrl: character.teamBoost.iconUrl ?? "",
        }
      : emptyTeamBoost(),

    strengths: character?.strengths ?? [],
    weaknesses: character?.weaknesses ?? [],
    recommendedMedals:
      character?.recommendedMedals ?? [],
    relatedCharacters:
      character?.relatedCharacters ?? [],
  };
}

/* ============================================================
 * Common UI
 * ============================================================ */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-6 outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

/*
 * 複数選択タグUI
 */
function TagPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(
        selected.filter((item) => item !== option),
      );
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-black">
          {label}
        </span>

        <span className="text-[10px] text-muted-foreground">
          {selected.length}個選択中
        </span>
      </div>

      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-background p-3">
        {options.map((option) => {
          const active = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={
                active
                  ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-[11px] font-black text-white"
                  : "rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-muted-foreground hover:border-primary hover:text-primary"
              }
            >
              {active ? "✓ " : ""}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/*
 * 文字列配列エディタ
 */
function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  function add() {
    onChange([...values, ""]);
  }

  function update(index: number, value: string) {
    onChange(
      values.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    );
  }

  function remove(index: number) {
    onChange(
      values.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-black">
          {label}
        </span>

        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-black hover:border-primary hover:text-primary"
        >
          <Plus size={12} />
          追加
        </button>
      </div>

      <div className="space-y-2">
        {values.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-muted-foreground">
            まだ登録されていません。
          </div>
        )}

        {values.map((value, index) => (
          <div
            key={`${label}-${index}`}
            className="flex gap-2"
          >
            <input
              value={value}
              onChange={(event) =>
                update(index, event.target.value)
              }
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded-md border border-border px-3 text-muted-foreground hover:border-red-300 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * Stats Editor
 * ============================================================ */

function StatsEditor({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  function updateRow(
    index: number,
    key: keyof StatRow,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      stats: current.stats.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [key]: value }
          : row,
      ),
    }));
  }

  function addRow() {
    setForm((current) => ({
      ...current,
      stats: [
        ...current.stats,
        emptyStatRow(),
      ],
    }));
  }

  function removeRow(index: number) {
    setForm((current) => ({
      ...current,
      stats: current.stats.filter(
        (_, rowIndex) => rowIndex !== index,
      ),
    }));
  }

  return (
    <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black">
            ステータス
          </h2>

          <p className="mt-1 text-[11px] text-muted-foreground">
            必要なレベルだけ追加できます。
          </p>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-black hover:border-primary hover:text-primary"
        >
          <Plus size={14} />
          レベル追加
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-border text-[10px] text-muted-foreground">
              <th className="p-2">Lv</th>
              <th className="p-2">総合力</th>
              <th className="p-2">体力</th>
              <th className="p-2">攻撃</th>
              <th className="p-2">防御</th>
              <th className="p-2">クリティカル</th>
              <th className="p-2" />
            </tr>
          </thead>

          <tbody>
            {form.stats.map((row, index) => (
              <tr
                key={index}
                className="border-b border-border last:border-0"
              >
                {(
                  [
                    "level",
                    "totalPower",
                    "hp",
                    "attack",
                    "defense",
                    "critical",
                  ] as const
                ).map((key) => (
                  <td key={key} className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={row[key]}
                      onChange={(event) =>
                        updateRow(
                          index,
                          key,
                          event.target.value,
                        )
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-2 text-xs outline-none focus:border-primary"
                    />
                  </td>
                ))}

                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <label className="flex items-center gap-2 text-xs font-black">
          <input
            type="checkbox"
            checked={form.overboostEnabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                overboostEnabled:
                  event.target.checked,
              }))
            }
          />

          Lv100超過ブーストのステータスを登録する
        </label>

        {form.overboostEnabled && (
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {(
              [
                ["totalPower", "総合力"],
                ["hp", "体力"],
                ["attack", "攻撃"],
                ["defense", "防御"],
                ["critical", "クリティカル"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                type="number"
                value={form.overboost[key]}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    overboost: {
                      ...current.overboost,
                      [key]: value,
                    },
                  }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * Skill Editor
 * ============================================================ */

function SkillsEditor({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  function updateSkill(
    index: number,
    patch: Partial<SkillForm>,
  ) {
    setForm((current) => ({
      ...current,
      skills: current.skills.map(
        (skill, skillIndex) =>
          skillIndex === index
            ? { ...skill, ...patch }
            : skill,
      ),
    }));
  }

  function addSkill() {
    setForm((current) => ({
      ...current,
      skills: [
        ...current.skills,
        emptySkill(),
      ],
    }));
  }

  function removeSkill(index: number) {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter(
        (_, skillIndex) =>
          skillIndex !== index,
      ),
    }));
  }

  function addExtraEffect(index: number) {
    const skill = form.skills[index];

    updateSkill(index, {
      extraEffects: [
        ...skill.extraEffects,
        "",
      ],
    });
  }

  return (
    <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black">
            スキル
          </h2>

          <p className="mt-1 text-[11px] text-muted-foreground">
            スキルごとに効果タグ・状態異常を複数選択できます。
          </p>
        </div>

        <button
          type="button"
          onClick={addSkill}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-black text-white"
        >
          <Plus size={14} />
          スキル追加
        </button>
      </div>

      <div className="space-y-5">
        {form.skills.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            スキルが登録されていません。
          </div>
        )}

        {form.skills.map((skill, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-background p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black">
                スキル {index + 1}
              </h3>

              <button
                type="button"
                onClick={() =>
                  removeSkill(index)
                }
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[10px] font-black text-muted-foreground hover:text-red-600"
              >
                <Trash2 size={13} />
                削除
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                label="スキルタイプ"
                value={skill.skillType}
                onChange={(value) =>
                  updateSkill(index, {
                    skillType:
                      value as SkillType,
                  })
                }
                options={
                  SKILL_TYPE_OPTIONS
                }
              />

              <Field
                label="スキル名"
                value={skill.name}
                onChange={(value) =>
                  updateSkill(index, {
                    name: value,
                  })
                }
                placeholder="例：火拳"
              />

              <Field
                label="威力（%）"
                type="number"
                value={skill.power}
                onChange={(value) =>
                  updateSkill(index, {
                    power: value,
                  })
                }
              />

              <Field
                label="クールタイム（秒）"
                type="number"
                value={skill.cooldown}
                onChange={(value) =>
                  updateSkill(index, {
                    cooldown: value,
                  })
                }
              />

              <Field
                label="状態異常・効果時間（秒）"
                type="number"
                value={skill.duration}
                onChange={(value) =>
                  updateSkill(index, {
                    duration: value,
                  })
                }
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="スキル説明"
                value={skill.description}
                onChange={(value) =>
                  updateSkill(index, {
                    description: value,
                  })
                }
                rows={5}
                placeholder="スキルの詳細な効果を入力"
              />
            </div>

            <div className="mt-5">
              <TagPicker
                label="スキル効果タグ（複数選択）"
                options={
                  SKILL_EFFECT_TAG_OPTIONS
                }
                selected={
                  skill.effectTags
                }
                onChange={(values) =>
                  updateSkill(index, {
                    effectTags:
                      values as string[],
                  })
                }
              />
            </div>

            <div className="mt-5">
              <TagPicker
                label="状態異常タグ（複数選択）"
                options={
                  STATUS_AILMENT_OPTIONS
                }
                selected={
                  skill.statusAilments
                }
                onChange={(values) =>
                  updateSkill(index, {
                    statusAilments:
                      values as string[],
                  })
                }
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black">
                  その他の効果
                </span>

                <button
                  type="button"
                  onClick={() =>
                    addExtraEffect(index)
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-black hover:border-primary hover:text-primary"
                >
                  <Plus size={12} />
                  追加
                </button>
              </div>

              <div className="space-y-2">
                {skill.extraEffects.map(
                  (effect, effectIndex) => (
                    <div
                      key={effectIndex}
                      className="flex gap-2"
                    >
                      <input
                        value={effect}
                        onChange={(event) =>
                          updateSkill(index, {
                            extraEffects:
                              skill.extraEffects.map(
                                (
                                  item,
                                  itemIndex,
                                ) =>
                                  itemIndex ===
                                  effectIndex
                                    ? event.target
                                        .value
                                    : item,
                              ),
                          })
                        }
                        className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs outline-none focus:border-primary"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateSkill(index, {
                            extraEffects:
                              skill.extraEffects.filter(
                                (
                                  _,
                                  itemIndex,
                                ) =>
                                  itemIndex !==
                                  effectIndex,
                              ),
                          })
                        }
                        className="rounded-md border border-border px-3 text-muted-foreground hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * Traits Editor
 * ============================================================ */

function TraitsEditor({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  function updateTrait(
    index: number,
    patch: Partial<TraitForm>,
  ) {
    setForm((current) => ({
      ...current,
      traits: current.traits.map(
        (trait, traitIndex) =>
          traitIndex === index
            ? { ...trait, ...patch }
            : trait,
      ),
    }));
  }

  return (
    <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black">
            特性
          </h2>

          <p className="mt-1 text-[11px] text-muted-foreground">
            特性は何個でも登録できます。
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setForm((current) => ({
              ...current,
              traits: [
                ...current.traits,
                emptyTrait(),
              ],
            }))
          }
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-black hover:border-primary hover:text-primary"
        >
          <Plus size={14} />
          特性追加
        </button>
      </div>

      <div className="space-y-3">
        {form.traits.map((trait, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[180px_180px_180px_1fr_auto]"
          >
            <SelectField
              label="特性枠"
              value={trait.slot}
              onChange={(value) =>
                updateTrait(index, {
                  slot:
                    value as TraitSlot,
                })
              }
              options={
                TRAIT_SLOT_OPTIONS
              }
            />

            <Field
              label="対象キャラ"
              value={trait.target}
              onChange={(value) =>
                updateTrait(index, {
                  target: value,
                })
              }
              placeholder="共通 / ルフィ / ロジャー"
            />

            <Field
              label="特性名"
              value={trait.traitName}
              onChange={(value) =>
                updateTrait(index, {
                  traitName: value,
                })
              }
              placeholder="キャラ特性1 / キャラ特性2"
            />

            <TextArea
              label="効果"
              value={trait.effect}
              onChange={(value) =>
                updateTrait(index, {
                  effect: value,
                })
              }
              rows={3}
              placeholder="特性の効果"
            />

            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  traits:
                    current.traits.filter(
                      (_, traitIndex) =>
                        traitIndex !== index,
                    ),
                }))
              }
              className="self-end rounded-md border border-border p-2 text-muted-foreground hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * Character Types Editor
 * ============================================================ */

function CharacterTypesEditor({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black">
            キャラクタータイプ
          </h2>

          <p className="mt-1 text-[11px] text-muted-foreground">
            複数登録できます。
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setForm((current) => ({
              ...current,
              characterTypes: [
                ...current.characterTypes,
                emptyCharacterType(),
              ],
            }))
          }
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-black hover:border-primary hover:text-primary"
        >
          <Plus size={14} />
          タイプ追加
        </button>
      </div>

      <div className="space-y-3">
        {form.characterTypes.map(
          (type, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-2"
            >
              <Field
                label="タイプID"
                value={type.typeId}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    characterTypes:
                      current.characterTypes.map(
                        (item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                typeId: value,
                              }
                            : item,
                      ),
                  }))
                }
              />

              <Field
                label="タイプ名"
                value={type.name}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    characterTypes:
                      current.characterTypes.map(
                        (item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                name: value,
                              }
                            : item,
                      ),
                  }))
                }
              />

              <div className="md:col-span-2">
                <TextArea
                  label="効果"
                  value={type.effect}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      characterTypes:
                        current.characterTypes.map(
                          (
                            item,
                            itemIndex,
                          ) =>
                            itemIndex ===
                            index
                              ? {
                                  ...item,
                                  effect:
                                    value,
                                }
                              : item,
                        ),
                    }))
                  }
                  rows={3}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    characterTypes:
                      current.characterTypes.filter(
                        (_, itemIndex) =>
                          itemIndex !==
                          index,
                      ),
                  }))
                }
                className="justify-self-start rounded-md border border-border px-3 py-2 text-xs font-black text-muted-foreground hover:text-red-600"
              >
                <Trash2
                  size={14}
                  className="mr-1 inline"
                />
                削除
              </button>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * Page
 * ============================================================ */

export default function AdminCharactersPage() {
  const [, navigate] = useLocation();

  const token =
    localStorage.getItem(
      ACCESS_TOKEN_KEY,
    ) ?? "";

  const [characters, setCharacters] =
    useState<Character[]>([]);

  const [form, setForm] =
    useState<FormState>(() =>
      makeForm(),
    );

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const filtered =
    useMemo(() => {
      const q =
        query.trim().toLowerCase();

      if (!q) return characters;

      return characters.filter(
        (character) =>
          `${character.id} ${
            character.name
          } ${
            character.reading ?? ""
          } ${
            character.faction ?? ""
          } ${
            (
              character.tags ?? []
            ).join(" ")
          }`
            .toLowerCase()
            .includes(q),
      );
    }, [characters, query]);

  async function loadCharacters() {
    if (!token) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const me =
        await fetch(
          `${API_BASE_URL}/users/me`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!me.ok) {
        localStorage.removeItem(
          ACCESS_TOKEN_KEY,
        );
        navigate("/auth");
        return;
      }

      const meData =
        await me.json();

      if (
        meData?.user?.role !==
        "admin"
      ) {
        setError(
          "管理者権限がありません。",
        );
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/characters`,
        );

      if (!response.ok) {
        throw new Error(
          "キャラクター一覧の取得に失敗しました",
        );
      }

      setCharacters(
        (await response.json()) as Character[],
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "読み込みに失敗しました",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCharacters();
  }, []);

  function startCreate() {
    setEditingId(null);
    setImageFile(null);
    setForm(makeForm());
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEdit(
    character: Character,
  ) {
    setEditingId(character.id);
    setImageFile(null);
    setForm(makeForm(character));
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function removeCharacter(
    character: Character,
  ) {
    if (!token) return;

    const ok =
      window.confirm(
        `「${character.name}」を削除します。この操作は元に戻せません。`,
      );

    if (!ok) return;

    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/characters/${encodeURIComponent(
            character.id,
          )}`,
          {
            method: "DELETE",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.message ??
            `削除に失敗しました (${response.status})`,
        );
      }

      if (
        editingId === character.id
      ) {
        startCreate();
      }

      setMessage(
        "キャラクターを削除しました。",
      );

      await loadCharacters();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "削除に失敗しました",
      );
    }
  }

  async function uploadImageFile(
    file: File,
    characterId: string,
  ) {
    if (!token) {
      throw new Error(
        "ログイン情報がありません",
      );
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ].includes(file.type)
    ) {
      throw new Error(
        "JPEG、PNG、WebP、AVIFのみ対応しています",
      );
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      throw new Error(
        "画像サイズは8MB以下にしてください",
      );
    }

    const contentBase64 =
      await new Promise<string>(
        (resolve, reject) => {
          const reader =
            new FileReader();

          reader.onload = () => {
            const result =
              String(
                reader.result ?? "",
              );

            const comma =
              result.indexOf(",");

            resolve(
              comma >= 0
                ? result.slice(
                    comma + 1,
                  )
                : result,
            );
          };

          reader.onerror = () =>
            reject(
              new Error(
                "画像の読み込みに失敗しました",
              ),
            );

          reader.readAsDataURL(file);
        },
      );

    const ext =
      file.name.includes(".")
        ? file.name
            .slice(
              file.name.lastIndexOf(
                ".",
              ),
            )
            .toLowerCase()
        : ".webp";

    setUploading(true);

    const response =
      await fetch(
        `${API_BASE_URL}/uploads/github`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            folder: "characters",
            filename: `${characterId}${ext}`,
            contentType: file.type,
            contentBase64,
          }),
        },
      );

    const data =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ??
          `画像アップロードに失敗しました (${response.status})`,
      );
    }

    return String(
      data?.publicUrl ?? "",
    );
  }

  function toNumber(
    value: string,
    label: string,
    required = false,
  ) {
    if (!value.trim()) {
      if (required) {
        throw new Error(
          `${label}を入力してください`,
        );
      }

      return undefined;
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      throw new Error(
        `${label}は数値で入力してください`,
      );
    }

    return number;
  }

  function buildStats() {
    return {
      levelStats: form.stats
        .filter((row) => row.level.trim())
        .map((row) => ({
          level: toNumber(row.level, "レベル", true)!,
          totalPower: toNumber(row.totalPower, "総合力", true)!,
          hp: toNumber(row.hp, "体力", true)!,
          attack: toNumber(row.attack, "攻撃", true)!,
          defense: toNumber(row.defense, "防御", true)!,
          critical: toNumber(row.critical, "クリティカル", true)!,
        })),
      level100Overboost: {
        totalPower: toNumber(form.overboost.totalPower, "超過ブースト総合力", true)!,
        hp: toNumber(form.overboost.hp, "超過ブースト体力", true)!,
        attack: toNumber(form.overboost.attack, "超過ブースト攻撃", true)!,
        defense: toNumber(form.overboost.defense, "超過ブースト防御", true)!,
        critical: toNumber(form.overboost.critical, "超過ブーストクリティカル", true)!,
      },
    };
  }

  function buildSkills() {
    return form.skills.map(
      (skill) => ({
        skillType:
          skill.skillType,

        name:
          skill.name.trim(),

        description:
          skill.description.trim(),

        power: toNumber(
          skill.power,
          "スキル威力",
        ),

        cooldown: toNumber(
          skill.cooldown,
          "クールタイム",
        ),

        effectTags:
          skill.effectTags,

        statusAilments:
          skill.statusAilments,

        /*
         * 旧データとの互換性用。
         */
        defenseIgnore:
          skill.effectTags.includes(
            "防御力無視",
          ),

        damageReductionIgnore:
          skill.effectTags.includes(
            "ダメージ減少無視",
          ),

        statusAilment:
          skill.statusAilments
            .join("、") || undefined,

        duration: toNumber(
          skill.duration,
          "効果時間",
        ),

        extraEffects:
          skill.extraEffects
            .map((value) =>
              value.trim(),
            )
            .filter(Boolean),

        changeFromSkillIndex:
          skill.changeFromSkillIndex.trim() === ""
            ? undefined
            : toNumber(
                skill.changeFromSkillIndex,
                "変化元スキル",
                true,
              ),

        changeCondition:
          skill.changeCondition || undefined,

        changeDuration:
          toNumber(
            skill.changeDuration,
            "変化後効果時間",
          ),
      }),
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!token) {
        navigate("/auth");
        return;
      }

      if (!form.name.trim()) {
        throw new Error(
          "キャラクター名は必須です",
        );
      }

      const stats =
        buildStats();

      const skills =
        buildSkills();

      const traits =
        form.traits
          .filter(
            (trait) =>
              trait.effect.trim(),
          )
          .map((trait) => ({
            slot: trait.slot,
            target: trait.target.trim() || "共通",
            traitName: trait.traitName.trim(),
            /*
             * 旧データとの互換性のためnameにも特性名を入れる。
             */
            name: trait.traitName.trim() || trait.slot,
            effect: trait.effect.trim(),
          }));

      const characterTypes =
        form.characterTypes
          .filter(
            (type) =>
              type.name.trim() ||
              type.typeId.trim(),
          )
          .map((type) => ({
            typeId:
              type.typeId.trim(),
            name:
              type.name.trim(),
            effect:
              type.effect.trim(),
          }));

      const payload = {
        name:
          form.name.trim(),

        description:
          form.description.trim(),

        tags:
          form.tags,

        attribute: {
          base:
            form.attributeBase,
          changesTo: [],
        },

        role: {
          base:
            form.roleBase,
          changesTo: [],
        },

        rarity:
          form.rarity,

        initialStars:
          Number(
            form.initialStars,
          ),

        stats,

        skills,

        traits,

        characterTypes,

        ...(form.teamBoostEnabled &&
        form.teamBoost.name.trim()
          ? {
              teamBoost: {
                boostId:
                  form.teamBoost.boostId.trim(),
                name:
                  form.teamBoost.name.trim(),
                effect:
                  form.teamBoost.effect.trim(),
                iconUrl:
                  form.teamBoost.iconUrl.trim() ||
                  undefined,
              },
            }
          : {}),

        tier:
          form.tier,

        imageUrl:
          form.imageUrl.trim() ||
          undefined,

        strengths:
          form.strengths
            .map((value) =>
              value.trim(),
            )
            .filter(Boolean),

        weaknesses:
          form.weaknesses
            .map((value) =>
              value.trim(),
            )
            .filter(Boolean),

        recommendedMedals:
          form.recommendedMedals
            .map((value) =>
              value.trim(),
            )
            .filter(Boolean),

        relatedCharacters:
          form.relatedCharacters
            .map((value) =>
              value.trim(),
            )
            .filter(Boolean),
      };

      /*
       * 新規作成ではサーバー側でIDを自動生成。
       */
      const response =
        await fetch(
          editingId
            ? `${API_BASE_URL}/characters/${encodeURIComponent(
                editingId,
              )}`
            : `${API_BASE_URL}/characters`,
          {
            method: editingId
              ? "PUT"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              payload,
            ),
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const details =
          Array.isArray(
            data?.details,
          )
            ? data.details
                .map(
                  (item: {
                    path?: string[];
                    message?: string;
                  }) =>
                    `${(
                      item.path ?? []
                    ).join(".")}: ${
                      item.message ?? ""
                    }`,
                )
                .join("\n")
            : "";

        throw new Error(
          details
            ? `${data?.message ?? "保存に失敗しました"}\n${details}`
            : data?.message ??
                `保存に失敗しました (${response.status})`,
        );
      }

      /*
       * 新規作成後、生成されたIDを取得。
       */
      const savedId =
        String(
          data?.id ??
            editingId ??
            "",
        );

      if (!savedId) {
        throw new Error(
          "保存には成功しましたが、キャラクターIDを取得できませんでした。",
        );
      }

      /*
       * 画像を選択していた場合は保存後にアップロード。
       */
      if (imageFile) {
        const publicUrl =
          await uploadImageFile(
            imageFile,
            savedId,
          );

        if (publicUrl) {
          const imageResponse =
            await fetch(
              `${API_BASE_URL}/characters/${encodeURIComponent(
                savedId,
              )}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization:
                    `Bearer ${token}`,
                },
                body: JSON.stringify({
                  imageUrl:
                    publicUrl,
                }),
              },
            );

          if (!imageResponse.ok) {
            throw new Error(
              "キャラクターは保存されましたが、画像URLの保存に失敗しました。",
            );
          }

          setForm(
            (current) => ({
              ...current,
              imageUrl:
                publicUrl,
            }),
          );
        }
      }

      setMessage(
        editingId
          ? "キャラクターを更新しました。"
          : `キャラクターを登録しました。ID: ${savedId}`,
      );

      setImageFile(null);

      if (!editingId) {
        setForm(makeForm());
        setEditingId(null);
      } else {
        setEditingId(savedId);
      }

      await loadCharacters();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "保存に失敗しました",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    setImageFile(file);
  }

  return (
    <GuideShell>
      <div className="animate-enter">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} />
            管理画面に戻る
          </Link>

          <button
            type="button"
            onClick={() =>
              void loadCharacters()
            }
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-black hover:bg-secondary"
          >
            <RefreshCw size={14} />
            再読み込み
          </button>
        </div>

        <PageIntro
          eyebrow="ADMIN / CHARACTERS"
          title="キャラクター管理"
          description="キャラクター情報・複数タグ・スキル効果・特性などを管理します。"
          action={
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-black text-white"
            >
              <Plus size={15} />
              新規登録
            </button>
          }
        />

        {(message || error) && (
          <div
            className={
              error
                ? "mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700"
                : "mb-5 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700"
            }
          >
            {error ? (
              <ShieldAlert
                size={16}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0"
              />
            )}

            <pre className="whitespace-pre-wrap font-sans">
              {error || message}
            </pre>
          </div>
        )}

        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ====================================================
           * Character List
           * ==================================================== */}
          <section className="min-w-0 rounded-md border border-card-border bg-card p-4 shadow-card">
            <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <Search
                size={15}
                className="text-muted-foreground"
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="ID、名前、読み、所属、タグで検索"
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>

            {loading ? (
              <p className="py-12 text-center text-xs text-muted-foreground">
                読み込み中…
              </p>
            ) : filtered.length ===
              0 ? (
              <p className="py-12 text-center text-xs text-muted-foreground">
                キャラクターがありません。
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.map(
                  (character) => (
                    <div
                      key={
                        character.id
                      }
                      className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
                    >
                      {character.imageUrl ? (
                        <img
                          src={
                            character.imageUrl
                          }
                          alt=""
                          className="h-12 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="grid h-12 w-10 place-items-center rounded bg-secondary text-[9px] font-black text-muted-foreground">
                          NO IMAGE
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-muted-foreground">
                          {character.id}
                        </div>

                        <div className="truncate text-sm font-black">
                          {character.name}
                        </div>

                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {
                            character
                              .attribute
                              ?.base
                          }{" "}
                          /{" "}
                          {
                            character
                              .role?.base
                          }{" "}
                          /{" "}
                          {
                            character.tier
                          }
                        </div>

                        {character.tags &&
                          character.tags.length >
                            0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {character.tags
                                .slice(
                                  0,
                                  4,
                                )
                                .map(
                                  (
                                    tag,
                                  ) => (
                                    <span
                                      key={
                                        tag
                                      }
                                      className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold"
                                    >
                                      {
                                        tag
                                      }
                                    </span>
                                  ),
                                )}
                            </div>
                          )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          startEdit(
                            character,
                          )
                        }
                        className="rounded-md border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <Pencil
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void removeCharacter(
                            character,
                          )
                        }
                        className="rounded-md border border-border p-2 text-muted-foreground hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          {/* ====================================================
           * Side Info
           * ==================================================== */}
          <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
            <div className="flex items-start gap-3">
              <ShieldAlert
                className="mt-0.5 shrink-0 text-primary"
                size={18}
              />

              <div>
                <p className="text-sm font-black">
                  管理者専用
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  新規キャラクターのIDは保存時にAPI側で自動生成されます。
                  タグは複数選択でき、後から検索・サポート編成などに利用できます。
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ======================================================
         * Editor
         * ====================================================== */}
        <form
          onSubmit={submit}
          className="space-y-6"
        >
          {/* Basic */}
          <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
            <div className="mb-5">
              <h2 className="text-base font-black">
                基本情報
              </h2>

              <p className="mt-1 text-[11px] text-muted-foreground">
                {editingId
                  ? `現在のID: ${editingId}`
                  : "IDは保存時に自動生成されます。"}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="キャラクター名 *"
                value={form.name}
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      name: value,
                    }),
                  )
                }
                placeholder="例：ルフィ"
              />

              <SelectField
                label="属性"
                value={
                  form.attributeBase
                }
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      attributeBase:
                        value,
                    }),
                  )
                }
                options={
                  ATTRIBUTE_OPTIONS
                }
              />

              <SelectField
                label="役職"
                value={
                  form.roleBase
                }
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      roleBase: value,
                    }),
                  )
                }
                options={ROLE_OPTIONS}
              />

              <SelectField
                label="レアリティ"
                value={form.rarity}
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      rarity: value,
                    }),
                  )
                }
                options={
                  RARITY_OPTIONS
                }
              />

              <SelectField
                label="初期★"
                value={
                  form.initialStars
                }
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      initialStars:
                        value,
                    }),
                  )
                }
                options={STAR_OPTIONS.map(
                  String,
                )}
              />

              <SelectField
                label="Tier"
                value={form.tier}
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      tier: value,
                    }),
                  )
                }
                options={
                  TIER_OPTIONS
                }
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="説明"
                value={
                  form.description
                }
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      description:
                        value,
                    }),
                  )
                }
                rows={5}
              />
            </div>

            <div className="mt-5">
              <TagPicker
                label="キャラタグ（複数選択）"
                options={
                  CHARACTER_TAG_OPTIONS
                }
                selected={form.tags}
                onChange={(values) =>
                  setForm(
                    (current) => ({
                      ...current,
                      tags: values,
                    }),
                  )
                }
              />
            </div>

            <div className="mt-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black">
                  キャラクター画像
                </span>

                <div className="rounded-md border border-dashed border-border bg-background p-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={
                      handleImageChange
                    }
                    className="w-full text-xs"
                  />

                  {imageFile && (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      選択中:{" "}
                      {
                        imageFile.name
                      }
                    </p>
                  )}
                </div>
              </label>
            </div>

            <div className="mt-4">
              <Field
                label="画像URL（既存URLを使用する場合）"
                value={
                  form.imageUrl
                }
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      imageUrl: value,
                    }),
                  )
                }
                placeholder="https://..."
              />
            </div>
          </section>

          <StatsEditor
            form={form}
            setForm={setForm}
          />

          <SkillsEditor
            form={form}
            setForm={setForm}
          />

          <TraitsEditor
            form={form}
            setForm={setForm}
          />

          <CharacterTypesEditor
            form={form}
            setForm={setForm}
          />

          {/* Team Boost */}
          <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
            <div className="mb-4">
              <h2 className="text-base font-black">
                チームブースト
              </h2>
            </div>

            <label className="flex items-center gap-2 text-xs font-black">
              <input
                type="checkbox"
                checked={
                  form.teamBoostEnabled
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      teamBoostEnabled:
                        event.target
                          .checked,
                    }),
                  )
                }
              />

              チームブーストを登録する
            </label>

            {form.teamBoostEnabled && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field
                  label="ブーストID"
                  value={
                    form.teamBoost
                      .boostId
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        teamBoost: {
                          ...current.teamBoost,
                          boostId:
                            value,
                        },
                      }),
                    )
                  }
                />

                <Field
                  label="名称"
                  value={
                    form.teamBoost
                      .name
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        teamBoost: {
                          ...current.teamBoost,
                          name: value,
                        },
                      }),
                    )
                  }
                />

                <div className="md:col-span-2">
                  <TextArea
                    label="効果"
                    value={
                      form.teamBoost
                        .effect
                    }
                    onChange={(value) =>
                      setForm(
                        (current) => ({
                          ...current,
                          teamBoost: {
                            ...current.teamBoost,
                            effect:
                              value,
                          },
                        }),
                      )
                    }
                  />
                </div>

                <Field
                  label="アイコンURL"
                  value={
                    form.teamBoost
                      .iconUrl
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        teamBoost: {
                          ...current.teamBoost,
                          iconUrl:
                            value,
                        },
                      }),
                    )
                  }
                />
              </div>
            )}
          </section>

          {/* Lists */}
          <section className="rounded-md border border-card-border bg-card p-5 shadow-card">
            <h2 className="mb-5 text-base font-black">
              攻略情報
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <StringListEditor
                label="長所"
                values={
                  form.strengths
                }
                onChange={(values) =>
                  setForm(
                    (current) => ({
                      ...current,
                      strengths:
                        values,
                    }),
                  )
                }
                placeholder="長所を入力"
              />

              <StringListEditor
                label="短所"
                values={
                  form.weaknesses
                }
                onChange={(values) =>
                  setForm(
                    (current) => ({
                      ...current,
                      weaknesses:
                        values,
                    }),
                  )
                }
                placeholder="短所を入力"
              />

              <StringListEditor
                label="おすすめメダル"
                values={
                  form.recommendedMedals
                }
                onChange={(values) =>
                  setForm(
                    (current) => ({
                      ...current,
                      recommendedMedals:
                        values,
                    }),
                  )
                }
                placeholder="メダルIDまたは名前"
              />

              <StringListEditor
                label="関連キャラクター"
                values={
                  form.relatedCharacters
                }
                onChange={(values) =>
                  setForm(
                    (current) => ({
                      ...current,
                      relatedCharacters:
                        values,
                    }),
                  )
                }
                placeholder="キャラクターID"
              />
            </div>
          </section>

          {/* Save */}
          <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-3 rounded-md border border-card-border bg-card/95 p-4 shadow-card backdrop-blur">
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-xs font-black hover:bg-secondary"
            >
              <Plus size={14} />
              新規入力に戻す
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <ImagePlus
                    size={15}
                  />
                  画像アップロード中…
                </>
              ) : saving ? (
                <>
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                  保存中…
                </>
              ) : (
                <>
                  <Save size={15} />
                  {editingId
                    ? "変更を保存"
                    : "キャラクターを登録"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </GuideShell>
  );
}
