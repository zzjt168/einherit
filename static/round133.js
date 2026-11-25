/* 电子继承 · 第一百三十三批增量（叠在 round132…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round133SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+域名+就绪冷静条 */
  async function paintHomeBrandEnDomainOkR133() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnDomainOkCalmBarR133");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnDomainOkCalmBarR133";
      bar.className = "home-brand-en-domain-ok-calm-r133";
      bar.setAttribute("role", "status");
      const brandVer = $("#homeBrandVersionOkCalmBarR132");
      const okVer = $("#homeOkVersionDomainCalmBarR131");
      const brandOk = $("#homeBrandBrandEnOkCalmBarR130");
      if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = en + " · " + domain + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-ok-calm-r133-mark">英文</span>
        <span class="muted home-brand-en-domain-ok-calm-r133-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainOkCalmGoR133">去设置</button>`;
      const btn = $("#homeBrandEnDomainOkCalmGoR133");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-ok-calm-r133-mark">英文</span>
        <span class="muted home-brand-en-domain-ok-calm-r133-sub">英文域名就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainOkCalmGoR133">去设置</button>`;
      const btn = $("#homeBrandEnDomainOkCalmGoR133");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+状态+编号组合复制 */
  async function ensureLegacyTitleStatusIdCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const status =
        String(it.status || it.category || "").trim() || "未填状态";
      const id = String(it.id);
      const line = title + " · " + status + " · #" + id;
      el.dataset.titleStatusId = line;
      if (el.querySelector(".lg-copy-title-status-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-status-id";
      btn.textContent = "复制标题状态编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleStatusId || "");
        softBanner(ok ? "已复制标题状态编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+处置说明+分类组合复制 */
  async function ensureAssetPlatformDisposeCategoryCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const category =
        String(it.category || it.tag || "").trim() || "未填分类";
      const line = platform + " · " + dispose + " · " + category;
      el.dataset.platformDisposeCategory = line;
      if (el.querySelector(".as-copy-platform-dispose-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-dispose-category";
      btn.textContent = "复制平台处置分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformDisposeCategory || "");
        softBanner(ok ? "已复制平台处置分类" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次标签+状态标签 */
  async function ensureCheckinLastAgoStatusLabelPlainR133Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoStatusLabelPlainR133CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoStatusLabelPlainR133CopyCard";
      card.className = "checkin-last-ago-status-label-plain-r133-copy";
      const nextWin = $("#checkinNextWindowEndsPlainR132CopyCard");
      const winStat = $("#checkinWindowEndsStatusLabelPlainR131CopyCard");
      const nextAgo = $("#checkinNextAtLastAgoPlainR130CopyCard");
      if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else if (winStat && winStat.parentNode)
        winStat.insertAdjacentElement("afterend", card);
      else if (nextAgo && nextAgo.parentNode)
        nextAgo.insertAdjacentElement("afterend", card);
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
      const lastAgo = String(cd.last_ago_label || "").trim() || "—";
      const statusLabel =
        String(
          cd.status_label ||
            cd.countdown_label ||
            user.escalation_state ||
            ""
        ).trim() || "—";
      const combo = lastAgo + " · " + statusLabel;
      const line =
        "距上次 · 状态标签 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-status-label-plain-r133-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoStatusLabelPlainR133CopyBtn">复制距上次状态R133</button>`;
      const btn = $("#checkinLastAgoStatusLabelPlainR133CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次状态R133" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+达标+进度百分比三元复制 */
  async function ensureTravelDepositedMetProgressPlainR133Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedMetProgressPlainR133CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedMetProgressPlainR133CopyCard";
      card.className = "travel-deposited-met-progress-plain-r133-copy";
      const progThr = $("#travelProgressThresholdShortfallPlainR132CopyCard");
      const shortDep = $("#travelShortfallThresholdDepositedPlainR131CopyCard");
      const metProg = $("#travelMetProgressBalancePlainR130CopyCard");
      if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
      else if (shortDep && shortDep.parentNode)
        shortDep.insertAdjacentElement("afterend", card);
      else if (metProg && metProg.parentNode)
        metProg.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const depositedRaw =
        fund.deposited != null ? fund.deposited : fund.balance;
      const deposited =
        depositedRaw == null
          ? "—"
          : String(Math.round(Number(depositedRaw)));
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const combo = deposited + " · " + met + " · " + pct + "%";
      const line =
        "差旅已存 · 达标 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-met-progress-plain-r133-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedMetProgressPlainR133CopyBtn">复制已存达标进度</button>`;
      const btn = $("#travelDepositedMetProgressPlainR133CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存达标进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存达标进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+医院+城市组合复制 */
  async function ensureAftercareIdHospitalCityCopyButtons() {
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
      const id = String(it.id);
      const hospital =
        String(it.hospital || it.title || "").trim() || "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + id + " · " + hospital + " · " + city;
      el.dataset.idHospitalCity = line;
      if (el.querySelector(".ac-copy-id-hospital-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-hospital-city";
      btn.textContent = "复制编号医院城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idHospitalCity || "");
        softBanner(ok ? "已复制编号医院城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+标题+时长提示组合复制 */
  async function ensureAuthCompleteTitleDurationCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteTitleDurationCopyR133Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteTitleDurationCopyR133Card";
      card.className = "av-complete-title-duration-copy-r133";
      const readyMiss = $("#avReadyMissingCompleteCopyR132Card");
      const titleDur = $("#avTitleDurationReadyCopyR131Card");
      const completeReady = $("#avCompleteReadyMissingCopyR130Card");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (titleDur && titleDur.parentNode)
        titleDur.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const complete =
        truthyFlag(data.complete) ||
        (missing.length === 0 && truthyFlag(data.ready))
          ? "完整"
          : "未完整";
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
      const prog = data.progress || {};
      const durationHint =
        String(
          data.duration_hint ||
            (prog.done != null && prog.total != null
              ? prog.done + "/" + prog.total
              : "") ||
            (script0 && script0.hint) ||
            ""
        ).trim() || "无时长提示";
      const combo = complete + " · " + title + " · " + durationHint;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-title-duration-copy-r133-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteTitleDurationCopyR133Btn">复制完成标题时长</button>`;
      const btn = $("#avCompleteTitleDurationCopyR133Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成标题时长" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成标题时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系方式+关系组合复制 */
  async function ensureHeirIdContactRelationCopyButtons() {
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
      const id = String(it.id);
      const contact = String(it.contact || "").trim() || "未填联系";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = "#" + id + " · " + contact + " · " + relation;
      if (el.querySelector(".bn-copy-id-contact-relation")) return;
      el.dataset.idContactRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-relation";
      btn.textContent = "复制编号联系关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactRelation || "");
        softBanner(ok ? "已复制编号联系关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+章节数+域名组合复制 */
  async function ensureHandoverProgressSectionsDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressSectionsDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressSectionsDomainCopyCard";
      card.className = "hand-progress-sections-domain-copy";
      const domBrand = $("#handDomainBrandDoneCopyCard");
      const secDone = $("#handSectionsDoneProgressCopyCard");
      const brandProg = $("#handBrandProgressDomainCopyCard");
      if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (brandProg && brandProg.parentNode)
        brandProg.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const sections =
        data.sections != null
          ? String(data.sections)
          : prog.total_types != null
            ? String(prog.total_types)
            : Array.isArray(prog.by_action)
              ? String(prog.by_action.length)
              : "—";
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = pct + "% · " + sections + " · " + domain;
      const line = "手册进度 · 章节 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-sections-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressSectionsDomainCopyBtn">复制进度章节域名</button>`;
      const btn = $("#handProgressSectionsDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度章节域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度章节域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+域名+就绪+英文品牌四元复制 + round 层含 133 */
  async function paintVersionDomainOkBrandEnR133CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionDomainOkBrandEnR133CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionDomainOkBrandEnR133CopyCard";
      card.className = "card settings-version-domain-ok-brand-en-r133-copy-card";
      const okEn = $("#settingsOkBrandEnVersionBrandR132CopyCard");
      const enVer = $("#settingsBrandEnVersionDomainOkR131CopyCard");
      const okBrand = $("#settingsOkBrandVersionDomainR130CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (enVer && enVer.parentNode)
        enVer.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · " + domain + " · " + ready + " · " + en;
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 英文</h3>
        <p class="muted">一键复制版本、域名、就绪状态与英文品牌（演示级）。</p>
        <p class="settings-version-domain-ok-brand-en-r133-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionDomainOkBrandEnR133CopyBtn">复制版本域名就绪英文</button>`;
      const btn = $("#settingsVersionDomainOkBrandEnR133CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名就绪英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList133() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 133;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 133); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round133 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnDomainOkR133().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleStatusIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformDisposeCategoryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoStatusLabelPlainR133Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelDepositedMetProgressPlainR133Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdHospitalCityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteTitleDurationCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdContactRelationCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressSectionsDomainCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnDomainOkR133().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleStatusIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformDisposeCategoryCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoStatusLabelPlainR133Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelDepositedMetProgressPlainR133Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdHospitalCityCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteTitleDurationCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdContactRelationCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressSectionsDomainCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainOkBrandEnR133CopyCard().catch(() => {});
        paintRoundLayerList133();
      }, 710);
      setTimeout(() => {
        paintVersionDomainOkBrandEnR133CopyCard().catch(() => {});
        paintRoundLayerList133();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandEnDomainOkR133().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyTitleStatusIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformDisposeCategoryCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoStatusLabelPlainR133Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedMetProgressPlainR133Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdHospitalCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteTitleDurationCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressSectionsDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainOkBrandEnR133CopyCard().catch(() => {});
      paintRoundLayerList133();
    }, 730);
  }
})();
