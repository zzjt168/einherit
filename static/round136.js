/* 电子继承 · 第一百三十六批增量（叠在 round135…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round136SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+英文品牌+就绪冷静条 */
  async function paintHomeVersionBrandEnOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionBrandEnOkCalmBarR136");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionBrandEnOkCalmBarR136";
      bar.className = "home-version-brand-en-ok-calm-r136";
      bar.setAttribute("role", "status");
      const okBrand = $("#homeOkBrandDomainCalmBarR135");
      const brandEnVer = $("#homeBrandBrandEnVersionCalmBarR134");
      const enDom = $("#homeBrandEnDomainOkCalmBarR133");
      if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (brandEnVer && brandEnVer.parentNode === home)
        brandEnVer.insertAdjacentElement("afterend", bar);
      else if (enDom && enDom.parentNode === home)
        enDom.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = ver + " · " + en + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-en-ok-calm-r136-mark">版本</span>
        <span class="muted home-version-brand-en-ok-calm-r136-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandEnOkCalmGoR136">去设置</button>`;
      const btn = $("#homeVersionBrandEnOkCalmGoR136");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-en-ok-calm-r136-mark">版本</span>
        <span class="muted home-version-brand-en-ok-calm-r136-sub">版本英文就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandEnOkCalmGoR136">去设置</button>`;
      const btn = $("#homeVersionBrandEnOkCalmGoR136");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割状态+处置+编号组合复制 */
  async function ensureLegacyStatusDispositionIdCopyButtons() {
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
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const id = String(it.id);
      const line = status + " · " + disposition + " · #" + id;
      el.dataset.statusDispositionId = line;
      if (el.querySelector(".lg-copy-status-disposition-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-status-disposition-id";
      btn.textContent = "复制状态处置编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusDispositionId || "");
        softBanner(ok ? "已复制状态处置编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+处置说明+摘要组合复制 */
  async function ensureAssetVisibilityDisposeSummaryCopyButtons() {
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
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const dispose =
        String(it.dispose_note || "").trim() || "未填处置";
      const summary =
        String(it.summary || "").trim() || "无摘要";
      const line = visibility + " · " + dispose + " · " + summary;
      el.dataset.visibilityDisposeSummary = line;
      if (el.querySelector(".as-copy-visibility-dispose-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-dispose-summary";
      btn.textContent = "复制可见处置摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityDisposeSummary || "");
        softBanner(ok ? "已复制可见处置摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+窗口截止 */
  async function ensureCheckinStatusLabelWindowEndsPlainR136Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelWindowEndsPlainR136CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelWindowEndsPlainR136CopyCard";
      card.className = "checkin-status-label-window-ends-plain-r136-copy";
      const winNext = $("#checkinWindowEndsNextAtPlainR135CopyCard");
      const nextAgo = $("#checkinNextAtLastAgoPlainR134CopyCard");
      const lastAgo = $("#checkinLastAgoStatusLabelPlainR133CopyCard");
      if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (nextAgo && nextAgo.parentNode)
        nextAgo.insertAdjacentElement("afterend", card);
      else if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "未标注";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : user.checkin_due_at != null
            ? String(user.checkin_due_at)
            : user.checkin_hard_due_at != null
              ? String(user.checkin_hard_due_at)
              : "—";
      const combo = statusLabel + " · " + windowEnds;
      const line =
        "报备状态 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-window-ends-plain-r136-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelWindowEndsPlainR136CopyBtn">复制状态窗口R136</button>`;
      const btn = $("#checkinStatusLabelWindowEndsPlainR136CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态窗口R136" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+短差+门槛三元复制 */
  async function ensureTravelMetShortfallThresholdPlainR136Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetShortfallThresholdPlainR136CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetShortfallThresholdPlainR136CopyCard";
      card.className = "travel-met-shortfall-threshold-plain-r136-copy";
      const shortBal = $("#travelShortfallBalanceDepositedPlainR135CopyCard");
      const balThr = $("#travelBalanceThresholdMetPlainR134CopyCard");
      const depMet = $("#travelDepositedMetProgressPlainR133CopyCard");
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (depMet && depMet.parentNode)
        depMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = met + " · " + short + " · " + thr;
      const line =
        "差旅达标 · 缺口 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-shortfall-threshold-plain-r136-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetShortfallThresholdPlainR136CopyBtn">复制达标缺口门槛</button>`;
      const btn = $("#travelMetShortfallThresholdPlainR136CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标缺口门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标缺口门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后医院+编号+服务类型组合复制 */
  async function ensureAftercareHospitalIdServiceCopyButtons() {
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
      const hospital =
        String(it.hospital || it.title || "").trim() || "未填医院";
      const id = String(it.id);
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const line = hospital + " · #" + id + " · " + service;
      el.dataset.hospitalIdService = line;
      if (el.querySelector(".ac-copy-hospital-id-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-id-service";
      btn.textContent = "复制医院编号服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalIdService || "");
        softBanner(ok ? "已复制医院编号服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+缺失项+完成态组合复制 */
  async function ensureAuthDurationMissingCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationMissingCompleteCopyR136Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationMissingCompleteCopyR136Card";
      card.className = "av-duration-missing-complete-copy-r136";
      const missReady = $("#avMissingReadyTitleCopyR135Card");
      const readyDur = $("#avReadyCompleteDurationCopyR134Card");
      const completeTitle = $("#avCompleteTitleDurationCopyR133Card");
      if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (completeTitle && completeTitle.parentNode)
        completeTitle.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      const duration =
        String(
          data.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            ""
        ).trim() || "无时长提示";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = duration + " · " + missLabel + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-missing-complete-copy-r136-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationMissingCompleteCopyR136Btn">复制时长缺失完成</button>`;
      const btn = $("#avDurationMissingCompleteCopyR136Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长缺失完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长缺失完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+关系+口令提示组合复制 */
  async function ensureHeirContactRelationPassphraseCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const relation = String(it.relation || "").trim() || "未填关系";
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const line = contact + " · " + relation + " · " + passphrase;
      if (el.querySelector(".bn-copy-contact-relation-passphrase-r136")) return;
      el.dataset.contactRelationPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-relation-passphrase-r136";
      btn.textContent = "复制联系关系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRelationPassphrase || "");
        softBanner(ok ? "已复制联系关系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+品牌+域名组合复制 */
  async function ensureHandoverSectionsBrandDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsBrandDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsBrandDomainCopyCard";
      card.className = "hand-sections-brand-domain-copy";
      const domainProg = $("#handDomainProgressDoneCopyCard");
      const brandDone = $("#handBrandDoneProgressCopyCard");
      const progSec = $("#handProgressSectionsDomainCopyCard");
      if (domainProg && domainProg.parentNode)
        domainProg.insertAdjacentElement("afterend", card);
      else if (brandDone && brandDone.parentNode)
        brandDone.insertAdjacentElement("afterend", card);
      else if (progSec && progSec.parentNode)
        progSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = sectionsCount + " · " + brand + " · " + domain;
      const line = "手册章节 · 品牌 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-brand-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsBrandDomainCopyBtn">复制章节品牌域名</button>`;
      const btn = $("#handSectionsBrandDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节品牌域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节品牌域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+英文品牌+中文品牌+就绪四元复制 + round 层含 136 */
  async function paintVersionBrandEnBrandOkR136CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionBrandEnBrandOkR136CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionBrandEnBrandOkR136CopyCard";
      card.className = "card settings-version-brand-en-brand-ok-r136-copy-card";
      const brandEn = $("#settingsBrandEnBrandOkDomainR135CopyCard");
      const brandOk = $("#settingsBrandOkDomainVersionR134CopyCard");
      const verDom = $("#settingsVersionDomainOkBrandEnR133CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = ver + " · " + en + " · " + brand + " · " + ready;
      card.innerHTML = `<h3>版本 · 英文 · 品牌 · 就绪</h3>
        <p class="muted">一键复制版本、英文品牌、中文品牌与就绪状态（演示级）。</p>
        <p class="settings-version-brand-en-brand-ok-r136-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionBrandEnBrandOkR136CopyBtn">复制版本英文品牌就绪</button>`;
      const btn = $("#settingsVersionBrandEnBrandOkR136CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本英文品牌就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 英文 · 品牌 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList136() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 136;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 136); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round136 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionBrandEnOk().catch(() => {}), 830);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyStatusDispositionIdCopyButtons().catch(() => {}),
      660
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityDisposeSummaryCopyButtons().catch(() => {}),
      660
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinStatusLabelWindowEndsPlainR136Copy().catch(() => {}),
      650
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelMetShortfallThresholdPlainR136Copy().catch(() => {}),
      670
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareHospitalIdServiceCopyButtons().catch(() => {}),
      660
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationMissingCompleteCopy().catch(() => {}),
      630
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactRelationPassphraseCopyButtons().catch(() => {}),
      660
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsBrandDomainCopy().catch(() => {}),
      670
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionBrandEnOk().catch(() => {}), 830);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyStatusDispositionIdCopyButtons().catch(() => {}),
        680
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisibilityDisposeSummaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinStatusLabelWindowEndsPlainR136Copy().catch(() => {}),
        670
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelMetShortfallThresholdPlainR136Copy().catch(() => {}),
        690
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareHospitalIdServiceCopyButtons().catch(() => {}),
        680
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationMissingCompleteCopy().catch(() => {}),
        650
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactRelationPassphraseCopyButtons().catch(() => {}),
        670
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsBrandDomainCopy().catch(() => {}),
        680
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionBrandEnBrandOkR136CopyCard().catch(() => {});
        paintRoundLayerList136();
      }, 720);
      setTimeout(() => {
        paintVersionBrandEnBrandOkR136CopyCard().catch(() => {});
        paintRoundLayerList136();
      }, 1400);
    }
  };

  setTimeout(() => paintHomeVersionBrandEnOk().catch(() => {}), 880);
  setTimeout(
    () => ensureLegacyStatusDispositionIdCopyButtons().catch(() => {}),
    900
  );
  setTimeout(
    () => ensureAssetVisibilityDisposeSummaryCopyButtons().catch(() => {}),
    920
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelWindowEndsPlainR136Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetShortfallThresholdPlainR136Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalIdServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationMissingCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRelationPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsBrandDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionBrandEnBrandOkR136CopyCard().catch(() => {});
      paintRoundLayerList136();
    }, 740);
  }
})();
