export const spilitFileName = (file: string) => {
  const split = file.split(".");
  const name = split.slice(0, split.length - 1).join(".");
  const ext = split[split.length - 1];
  return { name, ext };
};
