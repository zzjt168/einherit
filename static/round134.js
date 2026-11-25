/* 电子继承 · 第一百三十四批增量（叠在 round133…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round134SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+英文品牌+版本冷静条 */
  async function paintHomeBrandBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandBrandEnVersionCalmBarR134");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandBrandEnVersionCalmBarR134";
      bar.className = "home-brand-brand-en-version-calm-r134";
      bar.setAttribute("role", "status");
      const enDom = $("#homeBrandEnDomainOkCalmBarR133");
      const brandVer = $("#homeBrandVersionOkCalmBarR132");
      const okVer = $("#homeOkVersionDomainCalmBarR131");
      if (enDom && enDom.parentNode === home)
        enDom.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = brand + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-version-calm-r134-mark">品牌</span>
        <span class="muted home-brand-brand-en-version-calm-r134-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnVersionCalmGoR134">去设置</button>`;
      const btn = $("#homeBrandBrandEnVersionCalmGoR134");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-version-calm-r134-mark">品牌</span>
        <span class="muted home-brand-brand-en-version-calm-r134-sub">中英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnVersionCalmGoR134">去设置</button>`;
      const btn = $("#homeBrandBrandEnVersionCalmGoR134");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+处置+设备归属组合复制 */
  async function ensureLegacyBeneficiaryDispositionDeviceOwnerCopyButtons() {
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
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const owner =
        String(
          it.device_owner || it.beneficiary || it.dept || ""
        ).trim() || "未填归属";
      const line = bene + " · " + disposition + " · " + owner;
      el.dataset.beneficiaryDispositionDeviceOwner = line;
      if (el.querySelector(".lg-copy-beneficiary-disposition-device-owner"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-disposition-device-owner";
      btn.textContent = "复制受益人处置归属";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.beneficiaryDispositionDeviceOwner || ""
        );
        softBanner(ok ? "已复制受益人处置归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标题+摘要+可见性组合复制 */
  async function ensureAssetTitleSummaryVisibilityCopyButtons() {
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
      const title =
        String(it.title || it.platform || "").trim() || "无标题";
      const summary = String(it.summary || "").trim() || "无摘要";
      const vis = String(it.visibility || "").trim() || "未填可见性";
      const line = title + " · " + summary + " · " + vis;
      el.dataset.titleSummaryVisibility = line;
      if (el.querySelector(".as-copy-title-summary-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-title-summary-visibility";
      btn.textContent = "复制标题摘要可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleSummaryVisibility || "");
        softBanner(ok ? "已复制标题摘要可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+距上次标签 */
  async function ensureCheckinNextAtLastAgoPlainR134Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtLastAgoPlainR134CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtLastAgoPlainR134CopyCard";
      card.className = "checkin-next-at-last-ago-plain-r134-copy";
      const lastAgo = $("#checkinLastAgoStatusLabelPlainR133CopyCard");
      const nextWin = $("#checkinNextWindowEndsPlainR132CopyCard");
      const winStat = $("#checkinWindowEndsStatusLabelPlainR131CopyCard");
      if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
      else if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else if (winStat && winStat.parentNode)
        winStat.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const lastAgo = String(cd.last_ago_label || "").trim() || "—";
      const combo = nextAt + " · " + lastAgo;
      const line =
        "下次建议 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-last-ago-plain-r134-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtLastAgoPlainR134CopyBtn">复制下次距上次R134</button>`;
      const btn = $("#checkinNextAtLastAgoPlainR134CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次距上次R134" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+门槛+达标三元复制 */
  async function ensureTravelBalanceThresholdMetPlainR134Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdMetPlainR134CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdMetPlainR134CopyCard";
      card.className = "travel-balance-threshold-met-plain-r134-copy";
      const depMet = $("#travelDepositedMetProgressPlainR133CopyCard");
      const progThr = $("#travelProgressThresholdShortfallPlainR132CopyCard");
      const shortDep = $("#travelShortfallThresholdDepositedPlainR131CopyCard");
      if (depMet && depMet.parentNode)
        depMet.insertAdjacentElement("afterend", card);
      else if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
      else if (shortDep && shortDep.parentNode)
        shortDep.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const combo = bal + " · " + thr + " · " + met;
      const line =
        "差旅余额 · 门槛 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-met-plain-r134-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdMetPlainR134CopyBtn">复制余额门槛达标</button>`;
      const btn = $("#travelBalanceThresholdMetPlainR134CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后科室+服务类型+编号组合复制 */
  async function ensureAftercareDepartmentServiceIdCopyButtons() {
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
      const department =
        String(
          it.department || it.service_type || it.service || ""
        ).trim() || "未填科室";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const id = String(it.id);
      const line = department + " · " + service + " · #" + id;
      el.dataset.departmentServiceId = line;
      if (el.querySelector(".ac-copy-department-service-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-department-service-id";
      btn.textContent = "复制科室服务编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.departmentServiceId || "");
        softBanner(ok ? "已复制科室服务编号" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成态+时长提示组合复制 */
  async function ensureAuthReadyCompleteDurationCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteDurationCopyR134Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteDurationCopyR134Card";
      card.className = "av-ready-complete-duration-copy-r134";
      const completeTitle = $("#avCompleteTitleDurationCopyR133Card");
      const readyMiss = $("#avReadyMissingCompleteCopyR132Card");
      const titleDur = $("#avTitleDurationReadyCopyR131Card");
      if (completeTitle && completeTitle.parentNode)
        completeTitle.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (titleDur && titleDur.parentNode)
        titleDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const complete =
        truthyFlag(data.complete) ||
        (missing.length === 0 && truthyFlag(data.ready))
          ? "完整"
          : "未完整";
      const prog = data.progress || {};
      const script0 = Array.isArray(data.script) ? data.script[0] : null;
      const durationHint =
        String(
          data.duration_hint ||
            (prog.done != null && prog.total != null
              ? prog.done + "/" + prog.total
              : "") ||
            (script0 && script0.hint) ||
            ""
        ).trim() || "无时长提示";
      const combo = ready + " · " + complete + " · " + durationHint;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-duration-copy-r134-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteDurationCopyR134Btn">复制就绪完成时长</button>`;
      const btn = $("#avReadyCompleteDurationCopyR134Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成时长" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+口令提示+联系方式组合复制 */
  async function ensureHeirNamePassphraseContactCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · " + hint + " · " + contact;
      if (el.querySelector(".bn-copy-name-passphrase-contact-r134")) return;
      el.dataset.namePassphraseContactR134 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-passphrase-contact-r134";
      btn.textContent = "复制姓名口令联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.namePassphraseContactR134 || "");
        softBanner(ok ? "已复制姓名口令联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+完成数+进度百分比组合复制 */
  async function ensureHandoverBrandDoneProgressCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDoneProgressCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDoneProgressCopyCard";
      card.className = "hand-brand-done-progress-copy";
      const progSec = $("#handProgressSectionsDomainCopyCard");
      const domBrand = $("#handDomainBrandDoneCopyCard");
      const secDone = $("#handSectionsDoneProgressCopyCard");
      if (progSec && progSec.parentNode)
        progSec.insertAdjacentElement("afterend", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const brand = String(data.brand || "").trim() || "无品牌";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const combo = brand + " · " + done + " · " + pct + "%";
      const line = "手册品牌 · 完成 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-done-progress-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDoneProgressCopyBtn">复制品牌完成进度</button>`;
      const btn = $("#handBrandDoneProgressCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌完成进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌完成进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+就绪+域名+版本四元复制 + round 层含 134 */
  async function paintBrandOkDomainVersionR134CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandOkDomainVersionR134CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandOkDomainVersionR134CopyCard";
      card.className = "card settings-brand-ok-domain-version-r134-copy-card";
      const verDom = $("#settingsVersionDomainOkBrandEnR133CopyCard");
      const okEn = $("#settingsOkBrandEnVersionBrandR132CopyCard");
      const enVer = $("#settingsBrandEnVersionDomainOkR131CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (enVer && enVer.parentNode)
        enVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = brand + " · " + ready + " · " + domain + " · " + ver;
      card.innerHTML = `<h3>品牌 · 就绪 · 域名 · 版本</h3>
        <p class="muted">一键复制中文品牌、就绪状态、域名与版本（演示级）。</p>
        <p class="settings-brand-ok-domain-version-r134-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandOkDomainVersionR134CopyBtn">复制品牌就绪域名版本</button>`;
      const btn = $("#settingsBrandOkDomainVersionR134CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌就绪域名版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 就绪 · 域名 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList134() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 134;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 134); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round134 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandBrandEnVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyBeneficiaryDispositionDeviceOwnerCopyButtons().catch(
          () => {}
        ),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTitleSummaryVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtLastAgoPlainR134Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceThresholdMetPlainR134Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareDepartmentServiceIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteDurationCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNamePassphraseContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandDoneProgressCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandBrandEnVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryDispositionDeviceOwnerCopyButtons().catch(
            () => {}
          ),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTitleSummaryVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtLastAgoPlainR134Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceThresholdMetPlainR134Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentServiceIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteDurationCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNamePassphraseContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandDoneProgressCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandOkDomainVersionR134CopyCard().catch(() => {});
        paintRoundLayerList134();
      }, 710);
      setTimeout(() => {
        paintBrandOkDomainVersionR134CopyCard().catch(() => {});
        paintRoundLayerList134();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandBrandEnVersion().catch(() => {}), 870);
  setTimeout(
    () =>
      ensureLegacyBeneficiaryDispositionDeviceOwnerCopyButtons().catch(
        () => {}
      ),
    890
  );
  setTimeout(
    () => ensureAssetTitleSummaryVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtLastAgoPlainR134Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdMetPlainR134Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentServiceIdCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteDurationCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNamePassphraseContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDoneProgressCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandOkDomainVersionR134CopyCard().catch(() => {});
      paintRoundLayerList134();
    }, 730);
  }
})();
