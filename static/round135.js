/* 电子继承 · 第一百三十五批增量（叠在 round134…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round135SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
    }
    if (!el.parentNode || el.parentNode !== host) {
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = msg;
    el.appendChild(text);
    (actions || []).forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = a.label;
      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof a.onClick === "function") a.onClick();
      };
      el.appendChild(btn);
    });
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 9000);
    return el;
  }

  async function copyText(str) {
    const text = String(str || "");
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1";
  }

  function collectRoundLayers() {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    return Array.from(new Set(found)).sort((a, b) => a - b);
  }

  /* 1 · 首页就绪+中文品牌+域名冷静条 */
  async function paintHomeOkBrandDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandDomainCalmBarR135");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandDomainCalmBarR135";
      bar.className = "home-ok-brand-domain-calm-r135";
      bar.setAttribute("role", "status");
      const brandEnVer = $("#homeBrandBrandEnVersionCalmBarR134");
      const enDom = $("#homeBrandEnDomainOkCalmBarR133");
      const brandVer = $("#homeBrandVersionOkCalmBarR132");
      if (brandEnVer && brandEnVer.parentNode === home)
        brandEnVer.insertAdjacentElement("afterend", bar);
      else if (enDom && enDom.parentNode === home)
        enDom.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = ready + " · " + brand + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-domain-calm-r135-mark">就绪</span>
        <span class="muted home-ok-brand-domain-calm-r135-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandDomainCalmGoR135">去设置</button>`;
      const btn = $("#homeOkBrandDomainCalmGoR135");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-domain-calm-r135-mark">就绪</span>
        <span class="muted home-ok-brand-domain-calm-r135-sub">就绪品牌域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandDomainCalmGoR135">去设置</button>`;
      const btn = $("#homeOkBrandDomainCalmGoR135");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+标题+受益人组合复制 */
  async function ensureLegacyIdTitleBeneficiaryCopyButtons() {
    const list = $("#lgList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/legacy");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#lgList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it || it.id == null) return;
      const id = String(it.id);
      const title = String(it.title || "").trim() || "无标题";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const line = "#" + id + " · " + title + " · " + bene;
      el.dataset.idTitleBeneficiary = line;
      if (el.querySelector(".lg-copy-id-title-beneficiary-r135")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-title-beneficiary-r135";
      btn.textContent = "复制编号标题受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleBeneficiary || "");
        softBanner(ok ? "已复制编号标题受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+标签+平台组合复制 */
  async function ensureAssetCategoryTagPlatformCopyButtons() {
    const list = $("#asList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/assets");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#asList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it) return;
      const category =
        String(it.category || it.tag || "").trim() || "未填分类";
      const tag = String(it.tag || "").trim() || "无标签";
      const platform = String(it.platform || "").trim() || "未填平台";
      const line = category + " · " + tag + " · " + platform;
      el.dataset.categoryTagPlatform = line;
      if (el.querySelector(".as-copy-category-tag-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-tag-platform";
      btn.textContent = "复制分类标签平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryTagPlatform || "");
        softBanner(ok ? "已复制分类标签平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议 */
  async function ensureCheckinWindowEndsNextAtPlainR135Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextAtPlainR135CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextAtPlainR135CopyCard";
      card.className = "checkin-window-ends-next-at-plain-r135-copy";
      const nextAgo = $("#checkinNextAtLastAgoPlainR134CopyCard");
      const lastAgo = $("#checkinLastAgoStatusLabelPlainR133CopyCard");
      const nextWin = $("#checkinNextWindowEndsPlainR132CopyCard");
      if (nextAgo && nextAgo.parentNode)
        nextAgo.insertAdjacentElement("afterend", card);
      else if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
      else if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const user = st.user || {};
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : user.checkin_due_at != null
            ? String(user.checkin_due_at)
            : user.checkin_hard_due_at != null
              ? String(user.checkin_hard_due_at)
              : "—";
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const combo = windowEnds + " · " + nextAt;
      const line =
        "窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-at-plain-r135-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextAtPlainR135CopyBtn">复制窗口下次R135</button>`;
      const btn = $("#checkinWindowEndsNextAtPlainR135CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口下次R135" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+余额+已存三元复制 */
  async function ensureTravelShortfallBalanceDepositedPlainR135Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalanceDepositedPlainR135CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalanceDepositedPlainR135CopyCard";
      card.className = "travel-shortfall-balance-deposited-plain-r135-copy";
      const balThr = $("#travelBalanceThresholdMetPlainR134CopyCard");
      const depMet = $("#travelDepositedMetProgressPlainR133CopyCard");
      const progThr = $("#travelProgressThresholdShortfallPlainR132CopyCard");
      if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (depMet && depMet.parentNode)
        depMet.insertAdjacentElement("afterend", card);
      else if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const depositedRaw =
        fund.deposited != null ? fund.deposited : fund.balance;
      const deposited =
        depositedRaw == null
          ? "—"
          : String(Math.round(Number(depositedRaw)));
      const combo = short + " · " + bal + " · " + deposited;
      const line =
        "差旅缺口 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-deposited-plain-r135-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalanceDepositedPlainR135CopyBtn">复制缺口余额已存</button>`;
      const btn = $("#travelShortfallBalanceDepositedPlainR135CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口余额已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+城市+科室组合复制 */
  async function ensureAftercareStatusCityDepartmentCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#acList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it) return;
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(
          it.department || it.service_type || it.service || ""
        ).trim() || "未填科室";
      const line = status + " · " + city + " · " + department;
      el.dataset.statusCityDepartment = line;
      if (el.querySelector(".ac-copy-status-city-department")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-city-department";
      btn.textContent = "复制状态城市科室";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusCityDepartment || "");
        softBanner(ok ? "已复制状态城市科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+就绪+标题组合复制 */
  async function ensureAuthMissingReadyTitleCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingReadyTitleCopyR135Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingReadyTitleCopyR135Card";
      card.className = "av-missing-ready-title-copy-r135";
      const readyDur = $("#avReadyCompleteDurationCopyR134Card");
      const completeTitle = $("#avCompleteTitleDurationCopyR133Card");
      const readyMiss = $("#avReadyMissingCompleteCopyR132Card");
      if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (completeTitle && completeTitle.parentNode)
        completeTitle.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const latest = data.latest || {};
      const script0 = Array.isArray(data.script) ? data.script[0] : null;
      const title =
        String(
          data.title ||
            latest.original_name ||
            latest.active_label ||
            (script0 && script0.title) ||
            ""
        ).trim() || "授权视频";
      const combo = missLabel + " · " + ready + " · " + title;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-ready-title-copy-r135-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingReadyTitleCopyR135Btn">复制缺失就绪标题</button>`;
      const btn = $("#avMissingReadyTitleCopyR135Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失就绪标题" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失就绪标题暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+编号+姓名组合复制 */
  async function ensureHeirRelationIdNameCopyButtons() {
    const box = $("#heirsBox");
    if (!box) return;
    let items = [];
    try {
      const data = await api("/api/beneficiaries");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const nodes = $$("#heirsBox .item").filter((el) => el.querySelector("strong"));
    nodes.forEach((el, i) => {
      const it = items[i];
      if (!it || it.id == null) return;
      const relation = String(it.relation || "").trim() || "未填关系";
      const id = String(it.id);
      const name = String(it.name || "").trim() || "未填姓名";
      const line = relation + " · #" + id + " · " + name;
      if (el.querySelector(".bn-copy-relation-id-name")) return;
      el.dataset.relationIdName = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-id-name";
      btn.textContent = "复制关系编号姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationIdName || "");
        softBanner(ok ? "已复制关系编号姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+进度百分比+完成数组合复制 */
  async function ensureHandoverDomainProgressDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainProgressDoneCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainProgressDoneCopyCard";
      card.className = "hand-domain-progress-done-copy";
      const brandDone = $("#handBrandDoneProgressCopyCard");
      const progSec = $("#handProgressSectionsDomainCopyCard");
      const domBrand = $("#handDomainBrandDoneCopyCard");
      if (brandDone && brandDone.parentNode)
        brandDone.insertAdjacentElement("afterend", card);
      else if (progSec && progSec.parentNode)
        progSec.insertAdjacentElement("afterend", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain = String(data.domain || "").trim() || "无域名";
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = domain + " · " + pct + "% · " + done;
      const line = "手册域名 · 进度 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-progress-done-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainProgressDoneCopyBtn">复制域名进度完成</button>`;
      const btn = $("#handDomainProgressDoneCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名进度完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名进度完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+中文品牌+就绪+域名四元复制 + round 层含 135 */
  async function paintBrandEnBrandOkDomainR135CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnBrandOkDomainR135CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnBrandOkDomainR135CopyCard";
      card.className = "card settings-brand-en-brand-ok-domain-r135-copy-card";
      const brandOk = $("#settingsBrandOkDomainVersionR134CopyCard");
      const verDom = $("#settingsVersionDomainOkBrandEnR133CopyCard");
      const okEn = $("#settingsOkBrandEnVersionBrandR132CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = en + " · " + brand + " · " + ready + " · " + domain;
      card.innerHTML = `<h3>英文 · 品牌 · 就绪 · 域名</h3>
        <p class="muted">一键复制英文品牌、中文品牌、就绪状态与域名（演示级）。</p>
        <p class="settings-brand-en-brand-ok-domain-r135-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnBrandOkDomainR135CopyBtn">复制英文品牌就绪域名</button>`;
      const btn = $("#settingsBrandEnBrandOkDomainR135CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文品牌就绪域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 品牌 · 就绪 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList135() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 135;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 135); i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const missing = expected.filter((n) => uniq.indexOf(n) < 0);
    card.innerHTML = `<h3>版本与体验层</h3>
      <p class="muted">演示诊断：已加载的 round 增量脚本（只读）。</p>
      <p class="round-layer-summary"><strong>已加载</strong> round${
        loaded.length ? loaded[0] : "—"
      }…round${loaded.length ? loaded[loaded.length - 1] : "—"}
        · 共 ${loaded.length} 层</p>
      <div class="round-layer-chips" role="list">${loaded
        .map(
          (n) =>
            `<span class="tag round-layer-chip" role="listitem">round${n}</span>`
        )
        .join("")}</div>
      ${
        missing.length
          ? `<p class="muted" style="margin-top:8px">未检测到：${missing
              .map((n) => "round" + n)
              .join("、")}</p>`
          : `<p class="muted" style="margin-top:8px">round6…round135 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdTitleBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategoryTagPlatformCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsNextAtPlainR135Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallBalanceDepositedPlainR135Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusCityDepartmentCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingReadyTitleCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationIdNameCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainProgressDoneCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdTitleBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetCategoryTagPlatformCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinWindowEndsNextAtPlainR135Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallBalanceDepositedPlainR135Copy().catch(
            () => {}
          ),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareStatusCityDepartmentCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingReadyTitleCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationIdNameCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainProgressDoneCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnBrandOkDomainR135CopyCard().catch(() => {});
        paintRoundLayerList135();
      }, 710);
      setTimeout(() => {
        paintBrandEnBrandOkDomainR135CopyCard().catch(() => {});
        paintRoundLayerList135();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkBrandDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyIdTitleBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetCategoryTagPlatformCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextAtPlainR135Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalanceDepositedPlainR135Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusCityDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingReadyTitleCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationIdNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainProgressDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnBrandOkDomainR135CopyCard().catch(() => {});
      paintRoundLayerList135();
    }, 730);
  }
})();
