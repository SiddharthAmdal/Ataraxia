import { si } from "nyaapi";
async function test() {
  try {
    const results = await si.search("Dragon Ball Super", 20, { category: "1_2" });
    console.log("Success! Found:", results.length);
    console.log(results[0]);
  } catch (error) {
    console.error("Error:", error);
  }
}
test();
