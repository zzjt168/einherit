/* 电子继承 · 第一百七十八批增量（叠在 round177…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round178SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+英文品牌+中文品牌冷静条 */
  async function paintHomeDomainBrandEnBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnBrandCalmBarR178");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnBrandCalmBarR178";
      bar.className = "home-domain-brand-en-brand-calm-r178";
      bar.setAttribute("role", "status");
      const brandEnBrand = $("#homeBrandEnBrandVersionCalmBarR177");
      const brandDom = $("#homeBrandDomainVersionCalmBarR176");
      const verDom = $("#homeVersionDomainBrandEnCalmBarR175");
      if (brandEnBrand && brandEnBrand.parentNode === home)
        brandEnBrand.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + en + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-brand-calm-r178-mark">站点</span>
        <span class="muted home-domain-brand-en-brand-calm-r178-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnBrandCalmGoR178">去设置</button>`;
      const btn = $("#homeDomainBrandEnBrandCalmGoR178");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-brand-calm-r178-mark">站点</span>
        <span class="muted home-domain-brand-en-brand-calm-r178-sub">域名英文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnBrandCalmGoR178">去设置</button>`;
      const btn = $("#homeDomainBrandEnBrandCalmGoR178");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置意向+受益人组合复制（再进位） */
  async function ensureLegacyTitleDispositionBeneficiaryCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const line = title + " · " + disposition + " · " + beneficiary;
      el.dataset.titleDispositionBeneficiaryR178 = line;
      if (el.querySelector(".lg-copy-title-disposition-beneficiary-r178"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-title-disposition-beneficiary-r178";
      btn.textContent = "复制标题处置受益人R178";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.titleDispositionBeneficiaryR178 || ""
        );
        softBanner(ok ? "已复制标题处置受益人R178" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签+可见性组合复制（再进位） */
  async function ensureAssetSummaryTagVisibilityCopyButtons() {
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
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const tag = String(it.tag || it.label || "").trim() || "未填标签";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const line = summary + " · " + tag + " · " + visibility;
      el.dataset.summaryTagVisibilityR178 = line;
      if (el.querySelector(".as-copy-summary-tag-visibility-r178")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag-visibility-r178";
      btn.textContent = "复制摘要标签可见性R178";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryTagVisibilityR178 || "");
        softBanner(ok ? "已复制摘要标签可见性R178" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议时间（再进位） */
  async function ensureCheckinWindowEndsNextSuggestedPlainR178Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextSuggestedPlainR178CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextSuggestedPlainR178CopyCard";
      card.className = "checkin-window-ends-next-suggested-plain-r178-copy";
      const nextStatus = $("#checkinNextSuggestedAtStatusLabelPlainR177CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR176CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR175CopyCard");
      if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
      else if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
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
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const nextAt =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const combo = windowEnds + " · " + nextAt;
      const line =
        "报备窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-suggested-plain-r178-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextSuggestedPlainR178CopyBtn">复制窗口截止下次建议R178</button>`;
      const btn = $("#checkinWindowEndsNextSuggestedPlainR178CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口截止下次建议R178" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口截止下次建议文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+已存+短差三元复制（再进位） */
  async function ensureTravelBalanceDepositedShortfallPlainR178Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceDepositedShortfallPlainR178CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceDepositedShortfallPlainR178CopyCard";
      card.className = "travel-balance-deposited-shortfall-plain-r178-copy";
      const depShort = $("#travelDepositedShortfallThresholdPlainR177CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainR176CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR175CopyCard");
      if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
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
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = balance + " · " + deposited + " · " + shortfall;
      const line =
        "差旅余额 · 已存 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-deposited-shortfall-plain-r178-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceDepositedShortfallPlainR178CopyBtn">复制余额已存短差R178</button>`;
      const btn = $("#travelBalanceDepositedShortfallPlainR178CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额已存短差R178" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额已存短差文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+服务类型+科室组合复制（再进位） */
  async function ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR178() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = hospital + " · " + serviceType + " · " + department;
      el.dataset.hospitalServiceTypeDepartmentR178 = line;
      if (el.querySelector(".ac-copy-hospital-service-type-department-r178"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-service-type-department-r178";
      btn.textContent = "复制医院服务科室R178";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalServiceTypeDepartmentR178 || ""
        );
        softBanner(ok ? "已复制医院服务科室R178" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+完成态组合复制（再进位） */
  async function ensureAuthDurationHintReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyCompleteCopyR178Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyCompleteCopyR178Card";
      card.className = "av-duration-hint-ready-complete-copy-r178";
      const readyComplete = $("#avReadyCompleteMissingCopyR177Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR176Card");
      const missDur = $("#avMissingDurationHintReadyCopyR175Card");
      if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = duration + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-ready-complete-copy-r178-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyCompleteCopyR178Btn">复制时长就绪完成R178</button>`;
      const btn = $("#avDurationHintReadyCompleteCopyR178Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪完成R178" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+编号+联系方式组合复制（再进位） */
  async function ensureHeirRelationIdContactCopyButtonsR178() {
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
      const idLabel = String(it.id);
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = relation + " · " + idLabel + " · " + contact;
      if (el.querySelector(".bn-copy-relation-id-contact-r178")) return;
      el.dataset.relationIdContactR178 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-id-contact-r178";
      btn.textContent = "复制关系编号联系R178";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationIdContactR178 || "");
        softBanner(ok ? "已复制关系编号联系R178" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+章节数组合复制（进位） */
  async function ensureHandoverDoneDomainSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainSectionsCopyR178Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainSectionsCopyR178Card";
      card.className = "hand-done-domain-sections-copy-r178";
      const domSec = $("#handDomainSectionsProgressPctCopyR177Card");
      const secPct = $("#handSectionsProgressPctDoneCopyR176Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR175Card");
      if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      let domain = "einherit.cn";
      try {
        const h = await api("/api/health");
        domain = String(h.domain || data.domain || "einherit.cn").trim();
      } catch (_) {
        domain = String(data.domain || "einherit.cn").trim();
      }
      const sections =
        data.sections != null
          ? String(data.sections)
          : prog.sections != null
            ? String(prog.sections)
            : prog.total_types != null
              ? String(prog.total_types)
              : data.total != null
                ? String(data.total)
                : "—";
      const combo = done + " · " + domain + " · " + sections;
      const line = "手册完成 · 域名 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-done-domain-sections-copy-r178-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainSectionsCopyR178Btn">复制完成域名章节R178</button>`;
      const btn = $("#handDoneDomainSectionsCopyR178Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名章节R178" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成域名章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·ok+版本+英文品牌+中文品牌四元复制（进位） + round 层含 178 */
  async function paintOkVersionBrandEnBrandR178CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkVersionBrandEnBrandR178CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkVersionBrandEnBrandR178CopyCard";
      card.className = "card settings-ok-version-brand-en-brand-r178-copy-card";
      const verEn = $("#settingsVersionBrandEnBrandDomainR177CopyCard");
      const brandEn = $("#settingsBrandEnBrandDomainOkR176CopyCard");
      const brandDom = $("#settingsBrandDomainOkVersionR175CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = okLabel + " · " + ver + " · " + en + " · " + brand;
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 品牌</h3>
        <p class="muted">一键复制就绪态、版本、英文品牌与中文品牌（演示级）。</p>
        <p class="settings-ok-version-brand-en-brand-r178-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkVersionBrandEnBrandR178CopyBtn">复制就绪版本英文品牌R178</button>`;
      const btn = $("#settingsOkVersionBrandEnBrandR178CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪版本英文品牌R178" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList178() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 178;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 178); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round178 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsNextSuggestedPlainR178Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceDepositedShortfallPlainR178Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR178().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationIdContactCopyButtonsR178().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneDomainSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsNextSuggestedPlainR178Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceDepositedShortfallPlainR178Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR178().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationIdContactCopyButtonsR178().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionBrandEnBrandR178CopyCard().catch(() => {});
        paintRoundLayerList178();
      }, 890);
      setTimeout(() => {
        paintOkVersionBrandEnBrandR178CopyCard().catch(() => {});
        paintRoundLayerList178();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextSuggestedPlainR178Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceDepositedShortfallPlainR178Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR178().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationIdContactCopyButtonsR178().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionBrandEnBrandR178CopyCard().catch(() => {});
      paintRoundLayerList178();
    }, 910);
  }
})();
