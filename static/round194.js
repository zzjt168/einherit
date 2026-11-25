/* 电子继承 · 第一百九十四批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round194SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+中文品牌+英文品牌冷静条 */
  async function paintHomeVersionBrandBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionBrandBrandEnCalmBarR194");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionBrandBrandEnCalmBarR194";
      bar.className = "home-version-brand-brand-en-calm-r194";
      bar.setAttribute("role", "status");
      const domainEn = $("#homeDomainBrandEnVersionCalmBarR193");
      const brandDom = $("#homeBrandDomainVersionCalmBarR192");
      const brandEn = $("#homeBrandEnVersionDomainCalmBarR191");
      if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = ver + " · " + brand + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-brand-en-calm-r194-mark">版本</span>
        <span class="muted home-version-brand-brand-en-calm-r194-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandBrandEnCalmGoR194">去设置</button>`;
      const btn = $("#homeVersionBrandBrandEnCalmGoR194");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-brand-en-calm-r194-mark">版本</span>
        <span class="muted home-version-brand-brand-en-calm-r194-sub">版本品牌英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandBrandEnCalmGoR194">去设置</button>`;
      const btn = $("#homeVersionBrandBrandEnCalmGoR194");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置意向+设备归属+备注组合复制（四进位） */
  async function ensureLegacyDispositionDeviceOwnerNotesCopyButtons() {
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
      const disposition =
        String(
          it.disposition || it.action || it.dispose || it.dispose_action || ""
        ).trim() || "未填处置";
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填归属";
      const notes = String(it.notes || it.note || "").trim() || "无备注";
      const line = disposition + " · " + deviceOwner + " · " + notes;
      el.dataset.dispositionDeviceOwnerNotesR194 = line;
      if (el.querySelector(".lg-copy-disposition-device-owner-notes-r194")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-device-owner-notes-r194";
      btn.textContent = "复制处置归属备注R194";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionDeviceOwnerNotesR194 || "");
        softBanner(ok ? "已复制处置归属备注R194" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性+摘要组合复制（四进位） */
  async function ensureAssetTagVisibilitySummaryCopyButtons() {
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
      const tag = String(it.tag || it.tags || "").trim() || "无标签";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = tag + " · " + visibility + " · " + summary;
      el.dataset.tagVisibilitySummaryR194 = line;
      if (el.querySelector(".as-copy-tag-visibility-summary-r194")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-visibility-summary-r194";
      btn.textContent = "复制标签可见性摘要R194";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.tagVisibilitySummaryR194 || ""
        );
        softBanner(ok ? "已复制标签可见性摘要R194" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次距今+下次建议+窗口截止（四进位） */
  async function ensureCheckinLastAgoNextSuggestedWindowEndsPlainR194Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoNextSuggestedWindowEndsPlainR194CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoNextSuggestedWindowEndsPlainR194CopyCard";
      card.className =
        "checkin-last-ago-next-suggested-window-ends-plain-r194-copy";
      const nextStatus = $(
        "#checkinNextSuggestedStatusWindowEndsPlainR193CopyCard"
      );
      const winStatus = $(
        "#checkinWindowEndsStatusLastAgoPlainR192CopyCard"
      );
      const lastStatus = $(
        "#checkinLastAgoStatusNextSuggestedPlainR191CopyCard"
      );
      if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
      else if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const nextAt =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const windowEnds =
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            st.window_end ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const combo = lastAgo + " · " + nextAt + " · " + windowEnds;
      const line =
        "报备上次距今 · 下次建议 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-next-suggested-window-ends-plain-r194-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoNextSuggestedWindowEndsPlainR194CopyBtn">复制距今下次窗口R194</button>`;
      const btn = $("#checkinLastAgoNextSuggestedWindowEndsPlainR194CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距今下次窗口R194" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距今下次窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+余额+已存三元复制（四进位） */
  async function ensureTravelShortfallBalanceDepositedPlainR194Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalanceDepositedPlainR194CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalanceDepositedPlainR194CopyCard";
      card.className = "travel-shortfall-balance-deposited-plain-r194-copy";
      const depBal = $(
        "#travelDepositedBalanceShortfallPlainR193CopyCard"
      );
      const balThr = $(
        "#travelBalanceThresholdShortfallPlainR192CopyCard"
      );
      const thrShort = $(
        "#travelThresholdShortfallDepositedPlainR191CopyCard"
      );
      if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const combo = shortfall + " · " + balance + " · " + deposited;
      const line =
        "差旅缺口 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-deposited-plain-r194-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalanceDepositedPlainR194CopyBtn">复制缺口余额已存R194</button>`;
      const btn = $("#travelShortfallBalanceDepositedPlainR194CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口余额已存R194" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅科室+医院+服务类型组合复制（四进位） */
  async function ensureAftercareDepartmentHospitalServiceTypeCopyButtonsR194() {
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
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const line = department + " · " + hospital + " · " + serviceType;
      el.dataset.departmentHospitalServiceTypeR194 = line;
      if (el.querySelector(".ac-copy-department-hospital-service-type-r194"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-department-hospital-service-type-r194";
      btn.textContent = "复制科室医院服务R194";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.departmentHospitalServiceTypeR194 || ""
        );
        softBanner(ok ? "已复制科室医院服务R194" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+就绪+时长提示组合复制（四进位） */
  async function ensureAuthCompleteReadyDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyDurationHintCopyR194Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyDurationHintCopyR194Card";
      card.className = "av-complete-ready-duration-hint-copy-r194";
      const durComplete = $("#avDurationHintCompleteMissingCopyR193Card");
      const readyMiss = $("#avReadyMissingCompleteCopyR192Card");
      const missReady = $("#avMissingReadyDurationHintCopyR191Card");
      if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : latest.complete
      )
        ? "已完成"
        : "未完成";
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const combo = complete + " · " + ready + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-duration-hint-copy-r194-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyDurationHintCopyR194Btn">复制完成就绪时长R194</button>`;
      const btn = $("#avCompleteReadyDurationHintCopyR194Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪时长R194" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成就绪时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+关系+编号组合复制（四进位） */
  async function ensureHeirContactRelationIdCopyButtonsR194() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const relation =
        String(it.relation || it.role || it.relationship || "").trim() ||
        "未填关系";
      const idLabel = String(it.id);
      const line = contact + " · " + relation + " · " + idLabel;
      if (el.querySelector(".bn-copy-contact-relation-id-r194")) return;
      el.dataset.contactRelationIdR194 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-relation-id-r194";
      btn.textContent = "复制联系关系编号R194";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRelationIdR194 || "");
        softBanner(ok ? "已复制联系关系编号R194" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+完成数+进度百分比组合复制（四进位） */
  async function ensureHandoverDomainDoneProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainDoneProgressPctCopyR194Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainDoneProgressPctCopyR194Card";
      card.className = "hand-domain-done-progress-pct-copy-r194";
      const secPct = $("#handSectionsProgressPctDomainCopyR193Card");
      const doneDom = $("#handDoneDomainSectionsCopyR192Card");
      const pctSec = $("#handProgressPctSectionsDoneCopyR191Card");
      if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (pctSec && pctSec.parentNode)
        pctSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain =
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const pctRaw =
        prog.pct != null
          ? prog.pct
          : prog.percent != null
            ? prog.percent
            : data.progress_pct;
      const pct =
        pctRaw == null
          ? "—"
          : String(pctRaw) + (String(pctRaw).endsWith("%") ? "" : "%");
      const combo = domain + " · " + done + " · " + pct;
      const line = "手册域名 · 完成 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-done-progress-pct-copy-r194-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainDoneProgressPctCopyR194Btn">复制域名完成进度R194</button>`;
      const btn = $("#handDomainDoneProgressPctCopyR194Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名完成进度R194" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名完成进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintBrandEnOkBrandVersionR194CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnOkBrandVersionR194CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnOkBrandVersionR194CopyCard";
      card.className = "card settings-brand-en-ok-brand-version-r194-copy-card";
      const okVer = $("#settingsOkVersionBrandDomainR193CopyCard");
      const verBrand = $("#settingsVersionBrandDomainBrandEnR192CopyCard");
      const brandEnOk = $("#settingsBrandBrandEnVersionOkR191CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (brandEnOk && brandEnOk.parentNode)
        brandEnOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = en + " · " + okLabel + " · " + brand + " · " + ver;
      card.innerHTML = `<h3>英文 · ok · 品牌 · 版本</h3>
        <p class="muted">一键复制英文品牌、健康态、中文品牌与版本（演示级）。</p>
        <p class="settings-brand-en-ok-brand-version-r194-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnOkBrandVersionR194CopyBtn">复制英文就绪品牌版本R194</button>`;
      const btn = $("#settingsBrandEnOkBrandVersionR194CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文就绪品牌版本R194" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · ok · 品牌 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList194() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 194); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round194 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionBrandBrandEn().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDispositionDeviceOwnerNotesCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetTagVisibilitySummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinLastAgoNextSuggestedWindowEndsPlainR194Copy().catch(
          () => {}
        ),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallBalanceDepositedPlainR194Copy().catch(
          () => {}
        ),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareDepartmentHospitalServiceTypeCopyButtonsR194().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactRelationIdCopyButtonsR194().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainDoneProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionBrandBrandEn().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionDeviceOwnerNotesCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetTagVisibilitySummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinLastAgoNextSuggestedWindowEndsPlainR194Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallBalanceDepositedPlainR194Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentHospitalServiceTypeCopyButtonsR194().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactRelationIdCopyButtonsR194().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainDoneProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnOkBrandVersionR194CopyCard().catch(() => {});
        paintRoundLayerList194();
      }, 890);
      setTimeout(() => {
        paintBrandEnOkBrandVersionR194CopyCard().catch(() => {});
        paintRoundLayerList194();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionBrandBrandEn().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDispositionDeviceOwnerNotesCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagVisibilitySummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoNextSuggestedWindowEndsPlainR194Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalanceDepositedPlainR194Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentHospitalServiceTypeCopyButtonsR194().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRelationIdCopyButtonsR194().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainDoneProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnOkBrandVersionR194CopyCard().catch(() => {});
      paintRoundLayerList194();
    }, 910);
  }
})();
