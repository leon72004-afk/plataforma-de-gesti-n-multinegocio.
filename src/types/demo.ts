export type Moneda = {
  id: string;
  flag: string;
  sym: string;
  nm: string;
  code: string;
  locale: string;
  mult: number;
};

export type Tipo = {
  id: string;
  ic: string;
  nm: string;
  dc: string;
};

export type Sector = {
  id: string;
  ic: string;
  nm: string;
  sb: string;
  tipos: Tipo[];
};

export type DemoMsg = {
  d: number;
  f: 'i' | 'o';
  isOut?: boolean;
  t?: string;
  bt?: string[];
  list?: string[];
  img?: { em?: string; bg?: string; cap?: string; url?: string };
  pdf?: { nm: string; sz: string; dc: string };
  loc?: { em: string; addr: string };
  audio?: string;
  status?: { cls: string; ic: string; t: string };
};

export type DemoFlow = {
  wst: string;
  c1: string;
  c2: string;
  c3: string;
  lbl: string;
  hero: { v: string; l: string; ic: string };
  kv: { v: string; l: string }[];
  kpis: { v: string; c: string; l: string; s: string }[];
  fn: { l: string; cl: string }[];
  feed: string[];
  ops: (biz: string) => {
    t: string;
    st: string;
    lb: string;
    rows: [string, string][];
    p?: { pc: number; l: string };
  }[];
  ke: { i: number; v: string }[];
  msgs: DemoMsg[];
};
