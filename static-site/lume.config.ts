import lume from "https://deno.land/x/lume@v2.0.0/mod.ts";
import nunjucks from "https://deno.land/x/lume@v2.0.0/plugins/nunjucks.ts";

const site = lume({
  src: "./src",
  dest: "./dist",
});

site.use(nunjucks());

// サンプルデータ
site.data("articles", [
  {
    id: "1",
    slug: "sample-article",
    title: "サンプル記事",
    pub_date: new Date().toISOString(),
    category: "技術",
    tags: ["サンプル", "テスト"],
    body: "これはサンプル記事です。",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

export default site; 