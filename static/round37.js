/* 电子继承 · 第三十七批增量（叠在 round36…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round37SoftBanner_" + (hostId || "home");
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

  function parseTs(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number") return raw > 1e12 ? raw / 1000 : raw;
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n / 1000 : n;
    const d = Date.parse(String(raw));
    return Number.isNaN(d) ? 0 : d / 1000;
  }

  function formatTs(ts) {
    const t = parseTs(ts);
    if (!t) return "";
    if (typeof fmtTime === "function") return fmtTime(t);
    try {
      return new Date(t * 1000).toLocaleString();
    } catch (_) {
      return String(ts);
    }
  }

  /* 1 · 首页公司盘点完成度一句 */
  async function paintHomeCompanyProgress() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeCompanyProgressBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeCompanyProgressBar";
      bar.className = "home-company-progress-bar";
      bar.setAttribute("role", "status");
      const snap = $("#homeSnapshotCountBar");
      const hand = $("#homeHandProgressBar");
      const tf = $("#homeTravelThresholdBar");
      if (snap && snap.parentNode === home) snap.insertAdjacentElement("afterend", bar);
      else if (hand && hand.parentNode === home) hand.insertAdjacentElement("afterend", bar);
      else if (tf && tf.parentNode === home) tf.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/company");
      const prog = data.progress || {};
      const pct = Number(prog.pct != null ? prog.pct : 0);
      const filled = prog.filled != null ? prog.filled : null;
      const total = prog.total != null ? prog.total : null;
      const sub =
        filled != null && total != null
          ? `完成度约 ${pct}% · 已填 ${filled}/${total} 部`
          : `完成度约 ${pct}% · 按自己节奏盘点即可`;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-co-mark">个人公司化</span>
        <span class="muted home-co-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeCompanyGo">去公司</button>`;
      const btn = $("#homeCompanyGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("company");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割清理勾选项一键复制 */
  async function ensureLegacyFlagsCopyButtons() {
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
      if (!it) return;
      const parts = [];
      if (it.factory_reset) parts.push("出厂重置");
      if (it.clear_photos) parts.push("清照片");
      if (it.clear_chats) parts.push("清聊天");
      const line = parts.join(" · ");
      el.dataset.flagsLine = line;
      let btn = el.querySelector(".lg-copy-flags");
      if (!line) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-flags";
      btn.textContent = "复制清理项";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.flagsLine || "");
        softBanner(ok ? "已复制清理勾选项" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签一键复制 */
  async function ensureAssetTagCopyButtons() {
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
      const tag = it ? String(it.tag || "").trim() : "";
      if (it) el.dataset.tag = tag;
      if (!tag || el.querySelector(".as-copy-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag";
      btn.textContent = "复制标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tag || "");
        softBanner(ok ? "已复制备忘标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制登记姓名 */
  async function ensureCheckinNameCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNameCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNameCopyCard";
      card.className = "checkin-name-copy";
      const phone = $("#checkinPhoneCopyCard");
      const days = $("#checkinMemberDaysCopyCard");
      const lastNext = $("#checkinLastNextCopyCard");
      if (phone && phone.parentNode) phone.insertAdjacentElement("afterend", card);
      else if (days && days.parentNode) days.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const name = String((st.user || {}).name || "").trim();
      const line = name
        ? "登记姓名 · " + name + "（电子继承 · 演示）"
        : "尚未登记姓名";
      card.innerHTML = `<p class="muted checkin-name-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinNameCopyBtn"${
          name ? "" : " disabled"
        }>复制登记姓名</button>`;
      const btn = $("#checkinNameCopyBtn");
      if (btn && name) {
        btn.onclick = async () => {
          const ok = await copyText(name);
          softBanner(ok ? "已复制登记姓名" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">登记姓名暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额更新时间一键复制 */
  async function ensureTravelUpdatedAtCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelUpdatedAtCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelUpdatedAtCopyCard";
      card.className = "travel-updated-at-copy";
      const shortfall = $("#travelShortfallCopyCard");
      const prog = $("#travelProgressCopyCard");
      const balNum = $("#travelBalanceNumCopyCard");
      if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else if (balNum && balNum.parentNode)
        balNum.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const pretty = formatTs(fund.updated_at) || "暂无更新时间";
      const line = "差旅余额更新 · " + pretty;
      card.innerHTML = `<p class="muted travel-updated-at-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelUpdatedAtCopyBtn">复制更新时间</button>`;
      const btn = $("#travelUpdatedAtCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制余额更新时间" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额更新时间暂不可用</p>`;
    }
  }

  /* 6 · 善后联系窗口一键复制 */
  async function ensureAftercareWindowCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    $$("#acList .item").forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      const win = String(it.contact_window || "").trim();
      el.dataset.contactWindow = win;
      let btn = el.querySelector(".ac-copy-window");
      if (!win) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-window";
      btn.textContent = "复制联系窗口";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactWindow || "");
        softBanner(ok ? "已复制联系窗口" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频历史上传可见条数 */
  function paintAuthVisibleCount() {
    const list = $("#avList");
    const panel = $("#authvideo");
    if (!list || !panel) return;
    let bar = $("#avVisibleCountBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "avVisibleCountBar";
      bar.className = "muted av-visible-count";
      bar.setAttribute("role", "status");
      const complete = $("#avCompleteLabelCopyCard");
      const titles = $("#avScriptTitlesCopyCard");
      if (complete && complete.parentNode) complete.insertAdjacentElement("afterend", bar);
      else if (titles && titles.parentNode) titles.insertAdjacentElement("afterend", bar);
      else list.insertAdjacentElement("beforebegin", bar);
    }
    const n = $$("#avList .item").filter((el) => !el.hidden).length;
    bar.textContent = "当前可见 " + n + " 条上传 · 只读";
  }

  function bindAuthVisibleCountObserver() {
    const list = $("#avList");
    if (!list || list._r37VisObs) return;
    const obs = new MutationObserver(() => paintAuthVisibleCount());
    obs.observe(list, { childList: true, subtree: true, attributes: true });
    list._r37VisObs = obs;
  }

  /* 8 · 受益人口令提示一键复制 */
  async function ensureHeirPassphraseCopyButtons() {
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
      if (!it) return;
      const hint = String(it.passphrase_hint || "").trim();
      el.dataset.passphraseHint = hint;
      let btn = el.querySelector(".bn-copy-passphrase");
      if (!hint) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase";
      btn.textContent = "复制口令提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseHint || "");
        softBanner(ok ? "已复制口令提示" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册说明一键复制 */
  async function ensureHandoverNoteCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handNoteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handNoteCopyCard";
      card.className = "hand-note-copy";
      const share = $("#handShareHintCopyCard");
      const gen = $("#handGeneratedAtCopyCard");
      const execDom = $("#handExecutorDomainCopyCard");
      if (share && share.parentNode) share.insertAdjacentElement("afterend", card);
      else if (gen && gen.parentNode) gen.insertAdjacentElement("afterend", card);
      else if (execDom && execDom.parentNode)
        execDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const note =
        String(data.note || "").trim() ||
        "本清单为客观资产交割待办，不依赖情感授权。";
      card.innerHTML = `<p class="muted hand-note-copy-line">${esc(note)}</p>
        <button type="button" class="btn ghost sm" id="handNoteCopyBtn">复制手册说明</button>`;
      const btn = $("#handNoteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(note);
          softBanner(ok ? "已复制手册说明" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">手册说明暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制产品口号行 + round 层含 37 */
  async function paintSloganCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#sloganCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "sloganCopyCard";
      card.className = "card slogan-copy-card";
      const zh = $("#zhBrandDomainCopyCard");
      const legal = $("#legalEntityCopyCard");
      const sv = $("#serverVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (zh && zh.parentNode) zh.insertAdjacentElement("beforebegin", card);
      else if (legal && legal.parentNode) legal.insertAdjacentElement("beforebegin", card);
      else if (sv && sv.parentNode) sv.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const [co, h] = await Promise.all([api("/api/company"), api("/api/health")]);
      const slogan =
        String(co.slogan || "").trim() ||
        "生成我的个人公司年度报告 · 个人生命资产盘点";
      const domain = (h && h.domain) || "einherit.cn";
      const line = slogan + " · " + domain;
      card.innerHTML = `<h3>产品口号</h3>
        <p class="muted">一键复制产品口号与域名（演示级）。</p>
        <p class="slogan-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="sloganCopyBtn">复制产品口号行</button>`;
      const btn = $("#sloganCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制产品口号行" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>产品口号</h3><p class="muted">口号信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList37() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 37;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 37); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round37 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeCompanyProgress().catch(() => {}), 200);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyFlagsCopyButtons().catch(() => {}), 110);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetTagCopyButtons().catch(() => {}), 110);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinNameCopy().catch(() => {}), 100);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelUpdatedAtCopy().catch(() => {}), 120);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareWindowCopyButtons().catch(() => {}), 110);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => {
      bindAuthVisibleCountObserver();
      paintAuthVisibleCount();
    }, 80);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirPassphraseCopyButtons().catch(() => {}), 110);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverNoteCopy().catch(() => {}), 120);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeCompanyProgress().catch(() => {}), 200);
    if (id === "legacy")
      setTimeout(() => ensureLegacyFlagsCopyButtons().catch(() => {}), 130);
    if (id === "assets") setTimeout(() => ensureAssetTagCopyButtons().catch(() => {}), 120);
    if (id === "checkin") setTimeout(() => ensureCheckinNameCopy().catch(() => {}), 120);
    if (id === "travel") setTimeout(() => ensureTravelUpdatedAtCopy().catch(() => {}), 140);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareWindowCopyButtons().catch(() => {}), 130);
    if (id === "authvideo") {
      setTimeout(() => {
        bindAuthVisibleCountObserver();
        paintAuthVisibleCount();
      }, 100);
    }
    if (id === "heirs")
      setTimeout(() => ensureHeirPassphraseCopyButtons().catch(() => {}), 120);
    if (id === "handover") setTimeout(() => ensureHandoverNoteCopy().catch(() => {}), 130);
    if (id === "settings") {
      setTimeout(() => {
        paintSloganCopyCard().catch(() => {});
        paintRoundLayerList37();
      }, 170);
      setTimeout(() => {
        paintSloganCopyCard().catch(() => {});
        paintRoundLayerList37();
      }, 520);
    }
  };

  // Boot
  setTimeout(() => paintHomeCompanyProgress().catch(() => {}), 260);
  setTimeout(() => ensureLegacyFlagsCopyButtons().catch(() => {}), 280);
  setTimeout(() => ensureAssetTagCopyButtons().catch(() => {}), 300);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNameCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelUpdatedAtCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareWindowCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    bindAuthVisibleCountObserver();
    paintAuthVisibleCount();
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverNoteCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintSloganCopyCard().catch(() => {});
      paintRoundLayerList37();
    }, 190);
  }
})();
