// 消化酵素あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、大阪府教育委員会の中学2年理科プリント・大阪府教育センターのワークシート・兵庫県立高校の授業資料・広島県の資料・長寿科学振興財団の健康長寿ネット（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 1問は、説明を読んで、消化酵素など（アミラーゼ・ペプシン・トリプシン・リパーゼ・胆汁）を選ぶ。正解したら2段目「何を消化する？」を選ぶ。
// 胆汁は消化酵素ではなく消化液だが、中学の学習で消化酵素といっしょに覚えるので入れる。臓器全体は「人体のしくみ」で扱う。
// 選び肢は、ほかの4つから選ぶ（やさしいは2つ、ふつう・むずかしいは3つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    osk1: ["大阪府教育委員会 中学2年理科 確認プリント15（解答）「動物の体のつくりと働き」", "https://www.pref.osaka.lg.jp/documents/25642/rika_2nen_15_1kaku2_kai.pdf"],
    osk3: ["大阪府教育委員会 中学2年理科 発展プリント15「動物の体のつくりと働き」", "https://www.pref.osaka.lg.jp/documents/25642/rika_2nen_15_3hatu.pdf"],
    oskc: ["大阪府教育センター ワークシート「生命を維持するはたらき」", "https://www.osaka-c.ed.jp/rika/plan/6_3worksheet.pdf"],
    hyogo: ["兵庫県立高校 授業資料「消化器系の生理学」", "https://dmzcms.hyogo-c.ed.jp/kohoku-hs/NC3/wysiwyg/file/download/1/700"],
    hiro: ["広島県「肝臓の働き」", "https://www.pref.hiroshima.lg.jp/uploaded/attachment/662878.pdf"],
    tyojyu: ["長寿科学振興財団 健康長寿ネット「酵素の働きと健康効果」", "https://www.tyojyu.or.jp/net/kenkou-tyoju/eiyouso/koso-kenko.html"],
  };

  // 答えになる5つ
  const CLASSES = ["アミラーゼ", "ペプシン", "トリプシン", "リパーゼ", "胆汁"];

  // 2段目「何を消化する？」の3つ
  const GROUPS = {
    denpun: { name: "デンプンの消化", sub: "デンプンを分解する" },
    tanpaku: { name: "タンパク質の消化", sub: "タンパク質を分解する" },
    shibou: { name: "脂肪の消化", sub: "脂肪を分解する・分解を助ける" },
  };
  // どこから出る（「なぜ」に出す。兵庫県立高校の授業資料・広島県の資料）
  const CATS = { daeki: "だ液やすい液にふくまれる", ieki: "胃液にふくまれる", suieki: "すい液にふくまれる", kanzo: "肝臓でつくられる" };
  // 答えごとの決まり。2段目・どこから・決め手はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "アミラーゼ": { grp: "denpun", cat: "daeki", key: "アミラーゼは、デンプンを分解する消化酵素です。だ液やすい液にふくまれます。" },
    "ペプシン": { grp: "tanpaku", cat: "ieki", key: "ペプシンは、胃液にふくまれ、タンパク質を分解する消化酵素です。" },
    "トリプシン": { grp: "tanpaku", cat: "suieki", key: "トリプシンは、すい液にふくまれ、タンパク質を分解する消化酵素です。" },
    "リパーゼ": { grp: "shibou", cat: "suieki", key: "リパーゼは、すい液にふくまれ、脂肪を分解する消化酵素です。" },
    "胆汁": { grp: "shibou", cat: "kanzo", key: "胆汁は肝臓でつくられ、胆のうにたまる消化液です。脂肪を細かくして、消化を助けます。" },
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  const MEDIA = ["理科室で", "理科の授業で", "実験ノートで", "家で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["理科の授業で。", "プリントの問題。", "教科書のまとめ。", "テスト勉強で。", "ノートより。"];

  // どれかを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　どれ？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類を作る。grp・cat・key は答えの決まり RULE から。clue は手がかりの文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("a_daeki", 0, "アミラーゼ", "だ液の酵素", ["osk3"], "口の中で出るものです。",
      "ヒトのだ液には、デンプンを分解するはたらきがあります。これは、だ液の中にふくまれているアミラーゼという消化酵素によるものです（大阪府のプリント）。",
      ["だ液にふくまれていて、デンプンを分解する消化酵素。"]),
    K("p_ieki", 0, "ペプシン", "胃液の酵素", ["hyogo"], "胃で出るものです。",
      "胃液には、ペプシン・塩酸・粘液がふくまれています。ペプシンはタンパク質の消化にはたらきます（兵庫県立高校の授業資料）。",
      ["胃液にふくまれていて、タンパク質の消化にはたらく消化酵素。"]),
    K("t_suieki", 0, "トリプシン", "すい液のタンパク質の酵素", ["hyogo"], "すい液に入っていて、タンパク質にはたらきます。",
      "すい液には、アミラーゼ・リパーゼと、タンパク質を分解するトリプシンなどがふくまれています（兵庫県立高校の授業資料）。",
      ["すい液にふくまれていて、タンパク質を分解する消化酵素。"]),
    K("r_suieki", 0, "リパーゼ", "すい液の脂肪の酵素", ["hyogo", "tyojyu"], "すい液に入っていて、脂肪にはたらきます。",
      "すい液には脂肪を分解するリパーゼがふくまれています（兵庫県立高校の授業資料）。脂肪を分解する酵素をリパーゼといいます（健康長寿ネット）。",
      ["すい液にふくまれていて、脂肪を分解する消化酵素。"]),
    K("j_kanzo", 0, "胆汁", "肝臓でつくられる液", ["hiro"], "酵素ではなく消化液です。",
      "胆汁は肝臓でつくられ、胆管を通って胆のうにたまり、十二指腸に出されます（広島県の資料）。",
      ["肝臓でつくられ、胆のうにたまってから十二指腸に出される消化液。"]),
    // ---- ふつう ----
    K("a_bakuga", 1, "アミラーゼ", "麦芽糖にする", ["hyogo"], "デンプンにはたらくものです。",
      "だ液のアミラーゼは、デンプンをデキストリン・麦芽糖（マルトース）に分解します（兵庫県立高校の授業資料）。",
      ["だ液にふくまれ、デンプンをデキストリンや麦芽糖に分解する酵素。"]),
    K("p_ph2", 1, "ペプシン", "強い酸性ではたらく", ["tyojyu"], "胃の中は強い酸性です。",
      "胃で働くタンパク質を分解する酵素であるペプシンは、pH2という非常に低いpHで最もよく働き、中性付近ではほとんど働きません（健康長寿ネット）。",
      ["pH2という強い酸性で最もよくはたらき、中性の近くではほとんどはたらかない、タンパク質を分解する酵素。"]),
    K("t_zenbu", 1, "トリプシン", "全部を消化する液の中の酵素", ["hyogo"], "すい液は三大栄養素すべての酵素をふくみます。",
      "すい液は、三大栄養素の消化酵素をすべてふくむ消化液で、その中のタンパク質を分解する酵素がトリプシンなどです（兵庫県立高校の授業資料）。",
      ["三大栄養素の消化酵素をすべてふくむ消化液の中で、タンパク質を分解する酵素。"]),
    K("r_glycerol", 1, "リパーゼ", "脂肪酸にする", ["tyojyu"], "脂肪にはたらく酵素です。",
      "脂肪を脂肪酸とグリセロールに分解する酵素はリパーゼといいます（健康長寿ネット）。",
      ["脂肪を、脂肪酸とグリセロールに分解する酵素。"]),
    K("j_nyuka", 1, "胆汁", "脂肪を乳化する", ["hyogo"], "それ自身は分解しない消化液です。",
      "胆汁は脂肪のつぶを乳化し、すい液のリパーゼと脂肪がふれる面積を広げて、脂肪を分解する酵素がはたらきやすくします（兵庫県立高校の授業資料）。",
      ["脂肪のつぶを乳化して、脂肪を分解する酵素がふれる面を大きくする消化液。"]),
    // ---- むずかしい ----
    K("a_both", 2, "アミラーゼ", "だ液にもすい液にも", ["tyojyu", "hyogo"], "デンプンにはたらくものです。",
      "デンプンをブドウ糖に分解する酵素はアミラーゼです（健康長寿ネット）。アミラーゼは、だ液にも、すい液にもふくまれます（兵庫県立高校の授業資料）。",
      ["デンプンをブドウ糖に分解する酵素のなかまで、だ液にもすい液にもふくまれるもの。"]),
    K("p_ensan", 2, "ペプシン", "塩酸ではたらくようになる", ["hyogo"], "胃液には塩酸がふくまれます。",
      "ペプシンは、胃の主細胞からペプシノーゲンの形で出され、塩酸の水素イオンによって活性化されてペプシンになります（兵庫県立高校の授業資料）。",
      ["胃の主細胞からペプシノーゲンの形で出され、塩酸によってはたらくようになる消化酵素。"]),
    K("t_protease", 2, "トリプシン", "すい液のプロテアーゼ", ["tyojyu", "hyogo"], "胃液ではない方です。",
      "タンパク質をアミノ酸に分解する酵素をプロテアーゼといいます（健康長寿ネット）。すい液にふくまれるタンパク質を分解する酵素がトリプシンなどです（兵庫県立高校の授業資料）。",
      ["タンパク質を分解するプロテアーゼのなかまで、胃液ではなく、すい液にふくまれるもの。"]),
    K("r_menseki", 2, "リパーゼ", "乳化で面積が広がる", ["hyogo"], "すい液の酵素です。",
      "肝臓でできる消化液が脂肪を乳化してふれる面積を広げると、すい液のリパーゼが脂肪に作用しやすくなります（兵庫県立高校の授業資料）。",
      ["肝臓でできる消化液が脂肪を細かくしてふれる面積を広げると、はたらきやすくなる、すい液の酵素。"]),
    K("j_700", 2, "胆汁", "1日に約700mL", ["hyogo"], "肝臓の細胞から出るものです。",
      "胆汁は肝細胞から絶えず出され、胆のうに入ってこくなります。1日に出る量は約700mLです（兵庫県立高校の授業資料）。",
      ["肝臓の細胞から絶えず出され、1日に約700mL出る消化液。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "a_daeki|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null; // 継承した constructor などは知らない種類として扱う（CodeRabbit 2026-11-17）
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const SKK = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = SKK; else root.SKK = SKK;
})(typeof self !== "undefined" ? self : this);
