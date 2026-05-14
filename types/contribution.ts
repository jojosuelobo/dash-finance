export type ContributionKind    = "aporte" | "retirada";
export type ContributionType    = "cripto" | "investimento";
export type ContributionSubtype = "bitcoin" | "etc" | "outros";

export interface Contribution {
  id: string;
  date: string;               // YYYY-MM-DD
  value: number;              // sempre positivo
  kind: ContributionKind;
  type: ContributionType;
  subtype?: ContributionSubtype; // apenas para cripto
  quantidade?: number;           // unidades de cripto adquiridas
  cotacao?: number;              // preço por unidade em BRL na data da compra
  createdAt: string;
}
