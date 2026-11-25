/* 电子继承 · 第二十二批增量（叠在 round21…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const ICU_HIGHLIGHT_KEY = "einherit_icu_highlight_ids";
  const NOTE_TEMPLATES = [
    { id: "visit", label: "上门", text: "希望上门执行，时间可再约定。" },
    { id: "wipe", label: "删除数据", text: "请协助清除本机相册与聊天记录。" },
    { id: "reset", label: "出厂重置", text: "设备处理前请先出厂重置。" },
    { id: "gift", label: "转赠", text: "按交割清单转赠给指定接收人。" },
  ];
  const DEPT_SHORT_LOCAL = {
    production: "生产部",
    finance: "财务部",
    ip: "知识产权部",
    admin: "行政部",
    board: "董事会",
  };

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round22SoftBanner_" + (hostId || "home");
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

  function calmConfirm({ title, body, okLabel }) {
    return new Promise((resolve) => {
      const dlg = $("#confirmDialog");
      if (!dlg || typeof dlg.showModal !== "function") {
        resolve(window.confirm(body || title || "是否继续？"));
        return;
      }
      const t = $("#confirmTitle");
      const b = $("#confirmBody");
      const ok = $("#confirmOk");
      if (t) t.textContent = title || "确认操作";
      if (b) b.textContent = body || "是否继续？";
      if (ok) ok.textContent = okLabel || "确认";
      const onClose = () => {
        dlg.removeEventListener("close", onClose);
        resolve(dlg.returnValue === "ok");
      };
      dlg.addEventListener("close", onClose);
      try {
        dlg.showModal();
      } catch (_) {
        resolve(window.confirm(body || title || "是否继续？"));
      }
    });
  }

  async function copyText(str) {
    const s = String(str || "");
    if (!s) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(s);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = s;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  /* 1 · 首页授权视频门槛一句 */
  async function paintHomeAuthGate() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAuthGateBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAuthGateBar";
      bar.className = "home-auth-gate-bar";
      bar.setAttribute("role", "status");
      const icu = $("#homeIcuReadyBar");
      const r20 = $("#homeRound20Ready");
      const progress = $("#homeLegacyProgress");
      const hint = $("#homeHint");
      if (icu && icu.parentNode === home) icu.insertAdjacentElement("afterend", bar);
      else if (r20 && r20.parentNode === home) r20.insertAdjacentElement("afterend", bar);
      else if (progress && progress.parentNode === home)
        progress.insertAdjacentElement("afterend", bar);
      else if (hint && hint.parentNode === home) hint.insertAdjacentElement("afterend", bar);
      else home.appendChild(bar);
    }
    try {
      const st = await api("/api/auth-video");
      const ready = !!(st.ready || st.complete);
      const missing = st.missing_labels || (st.missing || []).map((m) => m.label || m.key);
      bar.hidden = false;
      if (ready) {
        bar.innerHTML = `<span class="home-auth-gate-mark">三勾已齐</span>
          <span class="muted home-auth-gate-sub">授权视频门槛齐备，可按自己的节奏开善后工单</span>
          <button type="button" class="btn ghost sm" id="homeAuthGateGo">去查看</button>`;
      } else {
        const miss =
          missing && missing.length ? "还差：" + missing.join("、") : "三勾尚未齐备";
        bar.innerHTML = `<span class="home-auth-gate-mark">可去补录</span>
          <span class="muted home-auth-gate-sub">${esc(miss)}。补齐问候、授权与处置思路即可</span>
          <button type="button" class="btn ghost sm" id="homeAuthGateGo">去补录</button>`;
      }
      const btn = $("#homeAuthGateGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("authvideo");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割批量出厂重置 */
  function ensureBatchFactoryResetBar() {
    const batch = $("#lgBatchBar");
    if (!batch || $("#lgBatchFactoryBar")) return;
    const bar = document.createElement("div");
    bar.id = "lgBatchFactoryBar";
    bar.className = "lg-batch-factory-bar";
    bar.innerHTML = `<h3 class="lg-batch-factory-title">批量出厂重置</h3>
      <p class="muted">勾选条目后，一键标上或清除出厂重置（演示）。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px">
        <button type="button" class="btn sm" id="lgBatchFactoryOn">勾选出厂重置</button>
        <button type="button" class="btn ghost sm" id="lgBatchFactoryOff">清除出厂重置</button>
      </div>`;
    const bene = $("#lgBatchBeneBar");
    if (bene && bene.parentNode) bene.insertAdjacentElement("afterend", bar);
    else batch.insertAdjacentElement("afterend", bar);

    async function run(flag) {
      const ids = $$("#lgList .lg-check:checked").map((c) => Number(c.dataset.id));
      if (!ids.length) {
        softBanner("请先勾选要处理的交割条目", "legacy");
        toast("请先勾选条目");
        return;
      }
      try {
        const r = await api("/api/legacy/batch-factory-reset", {
          method: "POST",
          body: JSON.stringify({ ids, factory_reset: !!flag }),
        });
        softBanner(r.note || (flag ? "已标出厂重置" : "已清除出厂重置"), "legacy");
        toast(r.note || "已更新");
        if (typeof refreshLegacy === "function") await refreshLegacy();
      } catch (e) {
        toast(e.message || "未完成");
      }
    }
    $("#lgBatchFactoryOn").onclick = () => run(true);
    $("#lgBatchFactoryOff").onclick = () => run(false);
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    ensureBatchFactoryResetBar();
    applyIcuHighlight();
  };

  /* 3 · 备忘部门空态 + 去盘点 */
  function paintAssetDeptEmpty() {
    const list = $("#asList");
    if (!list) return;
    const active = $("#asDeptFilterBar .chip.active");
    const dept = (active && active.dataset.asdept) || "";
    const visible = $$("#asList .item[data-id]").filter((el) => !el.hidden);
    let tip = $("#asDeptEmptyTip");
    let empty = $("#asDeptEmptyCta");
    if (dept && !visible.length) {
      if (tip) tip.remove();
      if (!empty) {
        empty = document.createElement("div");
        empty.id = "asDeptEmptyCta";
        empty.className = "as-dept-empty-cta";
        if (list.parentNode) list.parentNode.insertBefore(empty, list.nextSibling);
        else list.appendChild(empty);
      }
      const label =
        (typeof DEPT_SHORT !== "undefined" && DEPT_SHORT[dept]) ||
        DEPT_SHORT_LOCAL[dept] ||
        dept;
      empty.innerHTML = `<p class="empty-title">这一部门暂时没有备忘</p>
        <p class="muted empty-hint">${esc(label)} 可先去五部门盘点，再慢慢补一条。</p>
        <button type="button" class="btn ghost sm" id="asDeptEmptyGoCompany">去盘点</button>`;
      const go = $("#asDeptEmptyGoCompany");
      if (go) {
        go.onclick = () => {
          if (typeof show === "function") show("company");
          softBanner("在盘点页按部门记下要点即可", "company");
        };
      }
    } else {
      if (empty) empty.remove();
    }
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(paintAssetDeptEmpty, 40);
  };

  /* 4 · 报备成功复制时间戳 */
  function fmtCheckinStamp(ts) {
    if (!ts) return "";
    if (typeof fmtTime === "function") return fmtTime(ts);
    try {
      return new Date(Number(ts) * 1000).toLocaleString("zh-CN", { hour12: false });
    } catch (_) {
      return String(ts);
    }
  }

  async function showCheckinCopyBanner(hostId) {
    let stamp = "";
    try {
      const { user } = await api("/api/me");
      stamp = fmtCheckinStamp(user.last_checkin_at);
    } catch (_) {
      stamp = new Date().toLocaleString("zh-CN", { hour12: false });
    }
    const host =
      hostId ||
      (($("#checkin") && $("#checkin").classList.contains("active") && "checkin") ||
        "home");
    softBanner("报备已记下。", host, [
      {
        label: "复制本次报备时间",
        onClick: async () => {
          const ok = await copyText(stamp || "");
          toast(ok ? "已复制报备时间" : "复制未完成");
          if (ok) softBanner("报备时间已复制：" + stamp, host);
        },
      },
    ]);
  }

  const _doQuick = window.doQuickCheckin;
  if (typeof _doQuick === "function") {
    window.doQuickCheckin = async function () {
      await _doQuick();
      const activeCheckin =
        ($("#checkin") && $("#checkin").classList.contains("active")) ||
        document.body.dataset.panel === "checkin";
      await showCheckinCopyBanner(activeCheckin ? "checkin" : "home");
    };
  }

  /* 5 · 会员到期日只读日历点 */
  function paintMemberUntilCalendar(user) {
    const box = $("#memberBox");
    if (!box) return;
    let card = $("#memberUntilCalCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "memberUntilCalCard";
      card.className = "card member-until-cal-card";
      const first = box.querySelector(".card");
      if (first && first.parentNode) first.insertAdjacentElement("afterend", card);
      else box.appendChild(card);
    }
    const until = (user && user.member_until_iso) || "";
    if (!until) {
      card.innerHTML = `<h3>会员到期日</h3>
        <p class="muted">开通后，这里会温和标出到期那一天（演示日历）。</p>`;
      return;
    }
    const [y, m, d] = until.split("-").map((x) => Number(x));
    const first = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const startWd = (first.getDay() + 6) % 7; // Mon=0
    const cells = [];
    for (let i = 0; i < startWd; i++) cells.push('<span class="mcal-cell empty"></span>');
    for (let day = 1; day <= daysInMonth; day++) {
      const iso =
        y +
        "-" +
        String(m).padStart(2, "0") +
        "-" +
        String(day).padStart(2, "0");
      const isUntil = iso === until;
      cells.push(
        `<button type="button" class="mcal-cell ${isUntil ? "is-until" : ""}" data-mcal="${iso}" title="${iso}" ${
          isUntil ? 'aria-current="date"' : ""
        }>${day}</button>`
      );
    }
    card.innerHTML = `<h3>会员到期日（只读）</h3>
      <p class="muted">温和标出到期日 · ${esc(until)}（演示）</p>
      <div class="member-until-cal" role="grid" aria-label="${esc(y + "年" + m + "月")}">
        <div class="mcal-wd"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
        <div class="mcal-grid">${cells.join("")}</div>
      </div>
      <p class="muted mcal-hint" id="mcalHint">${esc(until)} · 演示有效期日</p>`;
    $$("#memberUntilCalCard [data-mcal]").forEach((btn) => {
      btn.onclick = () => {
        const hint = $("#mcalHint");
        if (!hint) return;
        if (btn.classList.contains("is-until")) {
          hint.textContent = btn.dataset.mcal + " · 演示有效期日";
        } else {
          hint.textContent = btn.dataset.mcal + " · 点选只读，到期日已温和标出";
        }
      };
    });
  }

  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    try {
      const { user } = await api("/api/me");
      paintMemberUntilCalendar(user);
    } catch (_) {}
  };

  /* 6 · 差旅门槛进度环强化 */
  async function enhanceTravelProgressRing() {
    const box = $("#travelBox");
    if (!box) return;
    try {
      const { fund } = await api("/api/travel-fund");
      const pct = Number(fund.progress_pct != null ? fund.progress_pct : 0);
      const thr = Number(fund.threshold || 2000);
      const bal = Number(fund.balance || 0);
      const label =
        fund.progress_label ||
        (fund.meets_threshold || fund.met ? "已达建议门槛" : "按自己节奏预存即可");
      let bar = $("#travelProgress");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "travelProgress";
        bar.className = "travel-progress";
        const card = box.querySelector(".card");
        if (card) {
          const stat = card.querySelector(".stat");
          if (stat) stat.insertAdjacentElement("afterend", bar);
          else card.appendChild(bar);
        } else box.appendChild(bar);
      }
      bar.classList.add("travel-progress-ringed");
      bar.innerHTML = `<div class="travel-ring-row">
          <div class="travel-ring-visual" style="--pct:${Math.max(0, Math.min(100, pct))}" aria-hidden="true">
            <span class="travel-ring-num">${Math.max(0, Math.min(100, pct))}<small>%</small></span>
          </div>
          <div class="travel-ring-meta">
            <strong>相对 ¥${thr.toFixed(0)} 建议门槛</strong>
            <span class="muted">当前 ¥${bal.toFixed(0)} · ${esc(label)} · ${Math.max(
        0,
        Math.min(100, pct)
      )}%</span>
          </div>
        </div>
        <div class="travel-progress-track" aria-hidden="true">
          <div class="travel-progress-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div>
        </div>`;
    } catch (_) {}
  }

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    await enhanceTravelProgressRing();
  };

  /* 7 · 善后工单备注模板 chip */
  function ensureAftercareNoteChips() {
    const notes = $("#acNotes");
    if (!notes || $("#acNoteChipBar")) return;
    const bar = document.createElement("div");
    bar.id = "acNoteChipBar";
    bar.className = "chip-row ac-note-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "备注短模板");
    bar.innerHTML =
      '<span class="muted ac-note-chip-label">短模板</span>' +
      NOTE_TEMPLATES.map(
        (t) =>
          `<button type="button" class="chip" data-acnote="${esc(t.id)}">${esc(t.label)}</button>`
      ).join("");
    const field = notes.closest("label") || notes.parentNode;
    if (field && field.parentNode) field.insertAdjacentElement("afterend", bar);
    else notes.insertAdjacentElement("afterend", bar);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-acnote]");
      if (!btn) return;
      const tpl = NOTE_TEMPLATES.find((t) => t.id === btn.dataset.acnote);
      if (!tpl) return;
      const cur = (notes.value || "").trim();
      notes.value = cur ? cur + (cur.endsWith("。") ? "" : "。") + tpl.text : tpl.text;
      notes.dispatchEvent(new Event("input", { bubbles: true }));
      softBanner("已填入备注模板：" + tpl.label, "aftercare");
      toast("已填入「" + tpl.label + "」");
    });
  }

  /* 8 · ICU 清册写入后交割高亮 */
  function saveIcuHighlightIds(items) {
    const ids = (items || [])
      .map((it) => (it && it.id != null ? String(it.id) : ""))
      .filter(Boolean);
    try {
      localStorage.setItem(
        ICU_HIGHLIGHT_KEY,
        JSON.stringify({ ids, at: Date.now() })
      );
    } catch (_) {}
  }

  function readIcuHighlightIds() {
    try {
      const raw = JSON.parse(localStorage.getItem(ICU_HIGHLIGHT_KEY) || "null");
      if (!raw || !Array.isArray(raw.ids)) return [];
      if (raw.at && Date.now() - Number(raw.at) > 10 * 60 * 1000) {
        localStorage.removeItem(ICU_HIGHLIGHT_KEY);
        return [];
      }
      return raw.ids.map(String);
    } catch (_) {
      return [];
    }
  }

  function applyIcuHighlight() {
    const ids = new Set(readIcuHighlightIds());
    if (!ids.size) return;
    let hit = 0;
    $$("#lgList .item[data-id]").forEach((el) => {
      if (ids.has(String(el.dataset.id))) {
        el.classList.add("lg-icu-flash");
        hit++;
        clearTimeout(el._icuFlash);
        el._icuFlash = setTimeout(() => {
          el.classList.remove("lg-icu-flash");
        }, 4500);
      }
    });
    if (hit) {
      softBanner("急症清册新写入的交割条目已短暂标出", "legacy");
      try {
        localStorage.removeItem(ICU_HIGHLIGHT_KEY);
      } catch (_) {}
    }
  }

  function patchIcuApplyHighlight() {
    const btn = $("#icuApply");
    if (!btn || btn.dataset.r22) return;
    btn.dataset.r22 = "1";
    const prev = btn.onclick;
    btn.onclick = async (ev) => {
      try {
        const r = await api("/api/icu-pack", {
          method: "POST",
          body: JSON.stringify({
            beneficiary: ($("#icuBene") && $("#icuBene").value) || "",
          }),
        });
        toast(r.message || "已写入");
        saveIcuHighlightIds(r.items || []);
        softBanner("清册已写入交割", "icu", [
          {
            label: "去交割看新条目",
            onClick: () => {
              if (typeof show === "function") show("legacy");
              setTimeout(applyIcuHighlight, 80);
            },
          },
        ]);
        if (typeof refreshIcu === "function") await refreshIcu();
      } catch (e) {
        toast(e.message);
        if (typeof prev === "function") return prev.call(btn, ev);
      }
    };
  }

  /* 9 · 医旅意向取消确认 */
  function bindMedCancelConfirm() {
    const box = $("#medIntents");
    if (!box || box.dataset.r22cancel) return;
    box.dataset.r22cancel = "1";
    box.addEventListener(
      "click",
      async (e) => {
        const btn = e.target.closest(".med-st[data-st='cancelled'], .med-cancel");
        if (!btn || !box.contains(btn)) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const id = Number(btn.dataset.id);
        if (!id) return;
        const ok = await calmConfirm({
          title: "撤回这条医旅意向？",
          body: "撤回后仍可再提交。按自己的节奏即可，不着急。",
          okLabel: "确认撤回",
        });
        if (!ok) return;
        try {
          await api("/api/hospitals/intent/cancel", {
            method: "POST",
            body: JSON.stringify({ id }),
          });
          toast("意向已温和撤回");
          softBanner("医旅意向已撤回，需要时可再提交", "med");
          if (typeof refreshMed === "function") {
            refreshMed(
              ($("#medQ") && $("#medQ").value.trim()) || "",
              ($("#medCountry") && $("#medCountry").value) || ""
            );
          }
        } catch (err) {
          toast(err.message || "未完成撤回");
        }
      },
      true
    );
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q, country, region) {
    await _refreshMed(q, country, region);
    bindMedCancelConfirm();
  };

  /* 10 · 设置·关于域名可点打开 */
  function linkifyDomain(host, domain) {
    if (!host) return;
    const d = domain || "einherit.cn";
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const text = node.nodeValue || "";
      if (!text.includes(d)) return;
      if (node.parentElement && node.parentElement.closest("a")) return;
      const parts = text.split(d);
      if (parts.length < 2) return;
      const frag = document.createDocumentFragment();
      parts.forEach((part, i) => {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
          const a = document.createElement("a");
          a.href = "https://" + d;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.className = "einherit-domain-link";
          a.textContent = d;
          a.title = "打开正式站 " + d;
          frag.appendChild(a);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  async function enhanceDomainLinks() {
    let domain = "einherit.cn";
    try {
      const h = await api("/api/health");
      if (h && h.domain) domain = h.domain;
    } catch (_) {}
    linkifyDomain($("#settingsBox"), domain);
    linkifyDomain($("#settingsProdHostCard"), domain);
    linkifyDomain($("#appAboutBox"), domain);
    // Explicit CTA on settings if still plain
    const prod = $("#settingsProdHostCard");
    if (prod && !prod.querySelector("a.einherit-domain-link")) {
      let row = $("#settingsDomainOpenRow");
      if (!row) {
        row = document.createElement("p");
        row.id = "settingsDomainOpenRow";
        row.className = "settings-domain-open-row";
        row.innerHTML = `正式站 <a class="einherit-domain-link" href="https://${esc(
          domain
        )}" target="_blank" rel="noopener noreferrer">${esc(domain)}</a>（新开）`;
        prod.appendChild(row);
      }
    }
    const about = $("#appAboutBox");
    if (about && !about.querySelector("a.einherit-domain-link")) {
      let row = $("#aboutDomainOpenRow");
      if (!row) {
        row = document.createElement("p");
        row.id = "aboutDomainOpenRow";
        row.className = "about-domain-open-row muted";
        row.innerHTML = `网站 <a class="einherit-domain-link" href="https://${esc(
          domain
        )}" target="_blank" rel="noopener noreferrer">${esc(domain)}</a>`;
        const h3 = about.querySelector("h3");
        if (h3) h3.insertAdjacentElement("afterend", row);
        else about.insertBefore(row, about.firstChild);
      }
    }
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeAuthGate().catch(() => {}), 0);
    if (id === "legacy") {
      setTimeout(ensureBatchFactoryResetBar, 60);
      setTimeout(applyIcuHighlight, 100);
    }
    if (id === "assets") setTimeout(paintAssetDeptEmpty, 80);
    if (id === "member")
      setTimeout(() => {
        api("/api/me")
          .then(({ user }) => paintMemberUntilCalendar(user))
          .catch(() => {});
      }, 60);
    if (id === "travel") setTimeout(() => enhanceTravelProgressRing().catch(() => {}), 60);
    if (id === "aftercare") setTimeout(ensureAftercareNoteChips, 40);
    if (id === "icu") setTimeout(patchIcuApplyHighlight, 40);
    if (id === "med") setTimeout(bindMedCancelConfirm, 60);
    if (id === "settings" || id === "appAbout" || id === "about") {
      setTimeout(() => enhanceDomainLinks().catch(() => {}), 80);
      setTimeout(() => enhanceDomainLinks().catch(() => {}), 350);
    }
  };

  // Boot
  paintHomeAuthGate().catch(() => {});
  patchIcuApplyHighlight();
  ensureAftercareNoteChips();
  bindMedCancelConfirm();
  if ($("#legacy") && $("#legacy").classList.contains("active")) {
    ensureBatchFactoryResetBar();
    applyIcuHighlight();
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    enhanceTravelProgressRing().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    enhanceDomainLinks().catch(() => {});
  }
})();
