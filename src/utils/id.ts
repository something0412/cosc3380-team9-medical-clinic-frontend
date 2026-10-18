export const ID_LENGTH = 8;

export function formatId(id: number) {
  return String(id).padStart(ID_LENGTH, "0");
}

export function parseId(value: string) {
  return value.length === ID_LENGTH && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;
}
