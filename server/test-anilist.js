import { META } from "@consumet/extensions";

async function test() {
  const anilist = new META.Anilist();
  try {
    const res = await anilist.search("dragon ball");
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
