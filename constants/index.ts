export const ROW_HEIGHT = 42;
export const HEADER_HEIGHT = 42;

export const IE_MARKER_MAP: Record<string, Record<string, string>> = {
  "one-to-one": {
    "from-mandatory": "ie-one-only",
    "from-optional": "ie-zero-one",
    "to-mandatory": "ie-one-only",
    "to-optional": "ie-zero-one",
  },
  "one-to-many": {
    "from-mandatory": "ie-one-only",
    "from-optional": "ie-zero-one",
    "to-mandatory": "ie-one-or-more",
    "to-optional": "ie-zero-many",
  },
  "many-to-one": {
    "from-mandatory": "ie-one-or-more",
    "from-optional": "ie-zero-many",
    "to-mandatory": "ie-one-only",
    "to-optional": "ie-zero-one",
  },
  "many-to-many": {
    "from-mandatory": "ie-one-or-more",
    "from-optional": "ie-zero-many",
    "to-mandatory": "ie-one-or-more",
    "to-optional": "ie-zero-many",
  },
};
