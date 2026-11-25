/* 电子继承 · 第五十三批增量（叠在 round52…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round53SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌一句 */
  async function paintHomeAppBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppBrandBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppBrandBar";
      bar.className = "home-app-brand-bar";
      bar.setAttribute("role", "status");
      const en = $("#homeBrandEnBar");
      const sv = $("#homeServerVersionBar");
      const r50 = $("#homeRound50ReadyBar");
      if (en && en.parentNode === home)
        en.insertAdjacentElement("afterend", bar);
      else if (sv && sv.parentNode === home)
        sv.insertAdjacentElement("afterend", bar);
      else if (r50 && r50.parentNode === home)
        r50.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health").catch(() => ({}));
      const app = String(h.app || "电子继承 App").trim();
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-brand-mark">品牌</span>
        <span class="muted home-app-brand-sub">${esc(
          app
        )} · 中文产品名</span>
        <button type="button" class="btn ghost sm" id="homeAppBrandGo">去设置</button>`;
      const btn = $("#homeAppBrandGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割标题+处置组合复制 */
  async function ensureLegacyTitleActionCopyButtons() {
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
      const title = String(it.title || "").trim();
      const action = String(it.action || "").trim();
      const line =
        title && action ? title + " · " + action : title || action;
      el.dataset.titleAction = line;
      if (!line || el.querySelector(".lg-copy-title-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-action";
      btn.textContent = "复制标题与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleAction || "");
        softBanner(ok ? "已复制标题与处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+摘要组合复制 */
  async function ensureAssetPlatformSummaryCopyButtons() {
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
      const platform = String(it.platform || "").trim();
      const summary = String(it.summary || "").trim();
      const line =
        platform && summary
          ? platform + " · " + summary
          : platform || summary;
      el.dataset.platformSummary = line;
      if (!line || el.querySelector(".as-copy-platform-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-summary";
      btn.textContent = "复制平台与摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformSummary || "");
        softBanner(ok ? "已复制平台与摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近报备相对时间 */
  async function ensureCheckinLastAgoCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoCopyCard";
      card.className = "checkin-last-ago-copy";
      const days = $("#checkinMemberDaysNumCopyCard");
      const interval = $("#checkinIntervalHoursNumCopyCard");
      const grace = $("#checkinGraceHoursNumCopyCard");
      if (days && days.parentNode)
        days.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label = String(
        ((st.countdown || {}).last_ago_label) || ""
      ).trim();
      if (!label) {
        card.innerHTML = `<p class="muted">最近报备相对时间暂不可用</p>`;
        return;
      }
      const line =
        "最近报备 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoCopyBtn">复制相对时间</button>`;
      const btn = $("#checkinLastAgoCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制相对时间" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">相对时间暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水中文种类标签一键复制 */
  async function ensureTravelLedgerKindLabelCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerKindLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerKindLabelCopyCard";
      card.className = "travel-ledger-kind-label-copy";
      const hasRef = $("#travelHasAftercareRefCopyCard");
      const kind = $("#travelLedgerKindCopyCard");
      const prog = $("#travelProgressLabelCopyCard");
      if (hasRef && hasRef.parentNode)
        hasRef.insertAdjacentElement("afterend", card);
      else if (kind && kind.parentNode)
        kind.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const row = (data.ledger || [])[0] || {};
      const label = String(row.kind_label || "").trim();
      if (!label) {
        card.innerHTML = `<p class="muted">流水种类标签暂不可用</p>`;
        return;
      }
      const line = "最近流水种类 · " + label;
      card.innerHTML = `<p class="muted travel-ledger-kind-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerKindLabelCopyBtn">复制种类标签</button>`;
      const btn = $("#travelLedgerKindLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制种类标签" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">种类标签暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+城市组合复制 */
  async function ensureAftercareIdCityCopyButtons() {
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
      if (!it || it.id == null) return;
      const city = String(it.city || "").trim();
      const line = city ? "#" + it.id + " · " + city : "#" + it.id;
      el.dataset.idCity = line;
      if (el.querySelector(".ac-copy-id-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-city";
      btn.textContent = "复制编号与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idCity || "");
        softBanner(ok ? "已复制编号与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频第三段脚本标题一键复制 */
  async function ensureAuthScriptTitle2Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptTitle2CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptTitle2CopyCard";
      card.className = "av-script-title2-copy";
      const t1 = $("#avScriptTitle1CopyCard");
      const t0 = $("#avScriptTitle0CopyCard");
      const h2 = $("#avScriptHint2CopyCard");
      if (t1 && t1.parentNode) t1.insertAdjacentElement("afterend", card);
      else if (t0 && t0.parentNode)
        t0.insertAdjacentElement("afterend", card);
      else if (h2 && h2.parentNode)
        h2.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const title = String((script[2] && script[2].title) || "").trim();
      if (!title) {
        card.innerHTML = `<p class="muted">处置思路段脚本标题暂不可用</p>`;
        return;
      }
      const line = "授权视频处置思路段标题 · " + title;
      card.innerHTML = `<p class="muted av-script-title2-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptTitle2CopyBtn">复制处置思路标题</button>`;
      const btn = $("#avScriptTitle2CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(title);
          softBanner(ok ? "已复制处置思路标题" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">处置思路标题暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名纯文本一键复制 */
  async function ensureHeirNamePlainCopyButtons() {
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
      const name = String(it.name || "").trim();
      if (!name || el.querySelector(".bn-copy-name-plain")) return;
      el.dataset.namePlain = name;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-plain";
      btn.textContent = "复制姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.namePlain || "");
        softBanner(ok ? "已复制姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册覆盖百分比纯数字一键复制 */
  async function ensureHandoverProgressPctNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctNumCopyCard";
      card.className = "hand-progress-pct-num-copy";
      const total = $("#handTotalTypesNumCopyCard");
      const filled = $("#handFilledTypesNumCopyCard");
      const brandEx = $("#handBrandExecutorCopyCard");
      if (total && total.parentNode)
        total.insertAdjacentElement("afterend", card);
      else if (filled && filled.parentNode)
        filled.insertAdjacentElement("afterend", card);
      else if (brandEx && brandEx.parentNode)
        brandEx.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let pct = prog.pct;
      if (pct == null && prog.filled_types != null && prog.total_types) {
        pct = Math.round(
          (Number(prog.filled_types) / Number(prog.total_types)) * 100
        );
      }
      if (pct == null) {
        card.innerHTML = `<p class="muted">手册覆盖百分比暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(pct)));
      const line = "手册覆盖百分比 · " + num;
      card.innerHTML = `<p class="muted hand-progress-pct-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctNumCopyBtn">复制覆盖百分比</button>`;
      const btn = $("#handProgressPctNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制覆盖百分比" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">覆盖百分比暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制域名纯文本 + round 层含 53 */
  async function paintDomainPlainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainPlainCopyCard";
      card.className = "card domain-plain-copy-card";
      const verPlain = $("#versionPlainCopyCard");
      const appVer = $("#appVersionCopyCard");
      const range = $("#round50RangeCopyCard");
      const roundList = $("#roundLayerListCard");
      if (verPlain && verPlain.parentNode)
        verPlain.insertAdjacentElement("beforebegin", card);
      else if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (range && range.parentNode)
        range.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      card.innerHTML = `<h3>产品域名</h3>
        <p class="muted">一键复制域名纯文本（演示级）。</p>
        <p class="domain-plain-copy-preview">${esc(domain)}</p>
        <button type="button" class="btn ghost sm" id="domainPlainCopyBtn">复制域名</button>`;
      const btn = $("#domainPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(domain);
          softBanner(ok ? "已复制域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>产品域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList53() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 53;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 53); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round53 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppBrand().catch(() => {}), 360);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyTitleActionCopyButtons().catch(() => {}), 270);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformSummaryCopyButtons().catch(() => {}),
      270
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinLastAgoCopy().catch(() => {}), 260);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerKindLabelCopy().catch(() => {}), 280);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareIdCityCopyButtons().catch(() => {}), 270);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptTitle2Copy().catch(() => {}), 240);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNamePlainCopyButtons().catch(() => {}), 270);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverProgressPctNumCopy().catch(() => {}), 280);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppBrand().catch(() => {}), 360);
    if (id === "legacy")
      setTimeout(() => ensureLegacyTitleActionCopyButtons().catch(() => {}), 290);
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformSummaryCopyButtons().catch(() => {}),
        280
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinLastAgoCopy().catch(() => {}), 280);
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerKindLabelCopy().catch(() => {}), 300);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareIdCityCopyButtons().catch(() => {}), 290);
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptTitle2Copy().catch(() => {}), 260);
    if (id === "heirs")
      setTimeout(() => ensureHeirNamePlainCopyButtons().catch(() => {}), 280);
    if (id === "handover")
      setTimeout(() => ensureHandoverProgressPctNumCopy().catch(() => {}), 290);
    if (id === "settings") {
      setTimeout(() => {
        paintDomainPlainCopyCard().catch(() => {});
        paintRoundLayerList53();
      }, 330);
      setTimeout(() => {
        paintDomainPlainCopyCard().catch(() => {});
        paintRoundLayerList53();
      }, 840);
    }
  };

  // Boot
  setTimeout(() => paintHomeAppBrand().catch(() => {}), 420);
  setTimeout(() => ensureLegacyTitleActionCopyButtons().catch(() => {}), 440);
  setTimeout(() => ensureAssetPlatformSummaryCopyButtons().catch(() => {}), 460);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerKindLabelCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptTitle2Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNamePlainCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainPlainCopyCard().catch(() => {});
      paintRoundLayerList53();
    }, 350);
  }
})();
