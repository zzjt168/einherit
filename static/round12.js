/* 电子继承 · 第十二批增量（叠在 round11…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId) {
    const host = (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    const eid = "round12SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner";
      el.hidden = true;
      host.insertBefore(el, host.firstChild);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  function emptyState(title, hint, go, cta) {
    return `<div class="empty-state">
      <p class="empty-title">${esc(title)}</p>
      <p class="empty-hint">${esc(hint)}</p>
      ${
        go
          ? `<button type="button" class="btn ghost sm" data-go="${esc(go)}">${esc(
              cta || "去看看"
            )}</button>`
          : ""
      }
    </div>`;
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

  /* 1 · 交割批量全选 / 取消（仅当前可见筛选结果） */
  function ensureLegacySelectAll() {
    const bar = $("#lgBatchBar");
    if (!bar) return;
    let row = $("#lgSelectAllRow");
    if (row) return row;
    row = document.createElement("div");
    row.id = "lgSelectAllRow";
    row.className = "row lg-select-all-row";
    row.innerHTML = `<button type="button" class="btn ghost sm" id="lgSelectVisible">全选当前</button>
      <button type="button" class="btn ghost sm" id="lgClearVisible">取消勾选</button>
      <span class="muted" id="lgSelectCount"></span>`;
    const h = bar.querySelector("h3");
    if (h) h.insertAdjacentElement("afterend", row);
    else bar.insertBefore(row, bar.firstChild);
    $("#lgSelectVisible").onclick = () => {
      const boxes = $$("#lgList .item:not([hidden]) .lg-check");
      boxes.forEach((c) => {
        c.checked = true;
      });
      syncSelectCount();
      softBanner(
        boxes.length ? `已勾选当前 ${boxes.length} 条` : "当前筛选下暂无可勾选项",
        "legacy"
      );
    };
    $("#lgClearVisible").onclick = () => {
      $$("#lgList .lg-check").forEach((c) => {
        c.checked = false;
      });
      syncSelectCount();
    };
    return row;
  }

  function syncSelectCount() {
    const el = $("#lgSelectCount");
    if (!el) return;
    const n = $$("#lgList .lg-check:checked").length;
    const vis = $$("#lgList .item:not([hidden]) .lg-check").length;
    el.textContent = n ? `已选 ${n} / 可见 ${vis}` : vis ? `可见 ${vis} 条` : "";
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    ensureLegacySelectAll();
    $$("#lgList .lg-check").forEach((c) => {
      if (c.dataset.r12) return;
      c.dataset.r12 = "1";
      c.addEventListener("change", syncSelectCount);
    });
    syncSelectCount();
  };

  /* 2 · 备忘到期排序 /「将到期」区 */
  function renderDueSoonZone(dueItems) {
    let zone = $("#asDueSoonZone");
    const list = $("#asList");
    if (!list || !list.parentNode) return;
    if (!(dueItems || []).length) {
      if (zone) zone.remove();
      return;
    }
    if (!zone) {
      zone = document.createElement("div");
      zone.id = "asDueSoonZone";
      zone.className = "card as-due-soon";
      list.parentNode.insertBefore(zone, list);
    }
    const today = new Date().toISOString().slice(0, 10);
    zone.innerHTML = `<h3>将到期</h3>
      <p class="muted">有检视日的备忘已置顶；按自己节奏看看即可。</p>
      <div class="list as-due-list">${dueItems
        .map((it) => {
          const due = (it.review_at || "").slice(0, 10);
          const overdue = due && due <= today;
          return `<div class="item" data-id="${it.id}">
            <span class="tag ${overdue ? "review-due" : "review-soon"}">检视 ${esc(due)}</span>
            <strong>${esc(it.platform || "")}</strong>
            <div class="muted">${esc(it.account_hint || "")} · ${esc(it.summary || "")}</div>
          </div>`;
        })
        .join("")}</div>`;
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    try {
      const qs = new URLSearchParams({ sort: "due" });
      const visBar = $("#asVisFilterBar .chip.active");
      const vis = (visBar && visBar.dataset.asvis) || "";
      if (vis) qs.set("visibility", vis);
      const data = await api("/api/assets?" + qs.toString());
      renderDueSoonZone(data.due_soon || []);
      // 列表顺序与 API 一致：有 review_at 的靠前
      const byId = new Map((data.items || []).map((it) => [String(it.id), it]));
      const nodes = $$("#asList .item[data-id]");
      if (nodes.length && byId.size) {
        const list = $("#asList");
        const ordered = (data.items || [])
          .map((it) => nodes.find((n) => String(n.dataset.id) === String(it.id)))
          .filter(Boolean);
        ordered.forEach((n) => list.appendChild(n));
      }
    } catch (_) {}
  };

  /* 3 · 首页会员条可点 → 会员页 */
  function bindMemberPill() {
    const pill = $("#memberPill");
    if (!pill || pill.dataset.r12) return;
    pill.dataset.r12 = "1";
    pill.setAttribute("role", "button");
    pill.setAttribute("tabindex", "0");
    pill.setAttribute("title", "打开会员中心");
    pill.classList.add("member-pill-clickable");
    const go = () => {
      if (typeof show === "function") show("member");
    };
    pill.addEventListener("click", go);
    pill.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  }

  /* 4 · 差旅最近退款只读卡（不改退款机） */
  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    try {
      const { fund } = await api("/api/travel-fund");
      const box = $("#travelBox");
      if (!box) return;
      let card = $("#travelLastRefundCard");
      const last = fund.last_refund;
      if (!last) {
        if (card) card.remove();
        return;
      }
      if (!card) {
        card = document.createElement("div");
        card.id = "travelLastRefundCard";
        card.className = "card travel-last-refund";
        const first = box.querySelector(".card");
        if (first && first.nextSibling) box.insertBefore(card, first.nextSibling);
        else box.appendChild(card);
      }
      const amt =
        typeof fmtMoney === "function"
          ? fmtMoney(Math.abs(last.amount))
          : "¥" + Math.abs(Number(last.amount) || 0).toFixed(0);
      const when = typeof fmtTime === "function" ? fmtTime(last.created_at) : "";
      card.innerHTML = `<h3>最近一笔退款（只读）</h3>
        <p class="muted">断缴后原路退回的温和回显，流程本身未改。</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">金额</span><b style="font-size:16px">${esc(
            amt
          )}</b></div>
          <div class="box"><span class="muted">时间</span><b style="font-size:14px">${esc(
            when
          )}</b></div>
        </div>
        <p class="muted" style="margin-top:8px">${esc(last.note || "已原路退回")}</p>`;
    } catch (_) {}
  };

  /* 5 · 善后工单联系窗口回显 */
  function ensureContactWindowField() {
    const form = $("#acAdd") && $("#acAdd").closest(".card");
    if (!form || $("#acContactWindow")) return;
    const notes = $("#acNotes");
    const field = document.createElement("label");
    field.className = "field";
    field.innerHTML = `联系窗口（可选）<input id="acContactWindow" placeholder="例如：工作日上午"/>`;
    if (notes && notes.parentNode) notes.parentNode.insertBefore(field, notes);
    else form.insertBefore(field, $("#acAdd"));
  }

  function patchAftercareSubmit() {
    const btn = $("#acAdd");
    if (!btn || btn.dataset.r12cw) return;
    btn.dataset.r12cw = "1";
    const prev = btn.onclick;
    btn.onclick = async (ev) => {
      ensureContactWindowField();
      try {
        const av = await api("/api/auth-video");
        if (!av.ready) {
          toast("请先完成授权视频（问候 / 授权 / 思路）");
          if (typeof show === "function") show("authvideo");
          return;
        }
        await api("/api/aftercare", {
          method: "POST",
          body: JSON.stringify({
            service_type: ($("#acType") && $("#acType").value) || "delete_data",
            title: ($("#acTitle") && $("#acTitle").value) || "",
            city: ($("#acCity") && $("#acCity").value) || "",
            visit_pref: ($("#acPref") && $("#acPref").value) || "",
            travel_budget: Number(($("#acTravel") && $("#acTravel").value) || 0),
            coop_state: ($("#acCoop") && $("#acCoop").value) || "pending",
            notes: ($("#acNotes") && $("#acNotes").value) || "",
            contact_window: ($("#acContactWindow") && $("#acContactWindow").value) || "",
          }),
        });
        toast("善后工单已提交");
        if ($("#acTitle")) $("#acTitle").value = "";
        if ($("#acContactWindow")) $("#acContactWindow").value = "";
        if (typeof refreshAftercare === "function") refreshAftercare();
      } catch (e) {
        toast(e.message);
        if (typeof prev === "function") return prev.call(btn, ev);
      }
    };
  }

  function echoContactWindows() {
    $$("#acList .item").forEach((el) => {
      if (el.querySelector(".ac-contact-window")) return;
      const cw = el.dataset.contactWindow || "";
      if (!cw) return;
      const line = document.createElement("div");
      line.className = "muted ac-contact-window";
      line.textContent = "联系窗口：" + cw;
      el.appendChild(line);
    });
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    ensureContactWindowField();
    patchAftercareSubmit();
    try {
      const { items } = await api("/api/aftercare");
      const nodes = $$("#acList .item");
      (items || []).forEach((it, i) => {
        const el = nodes[i];
        if (!el) return;
        if (it.contact_window) el.dataset.contactWindow = String(it.contact_window);
        // 若 round8 重绘后丢了行，按标题弱匹配
        if (!el.dataset.contactWindow && it.title) {
          const hit = nodes.find(
            (n) => (n.querySelector("strong") || {}).textContent === it.title
          );
          if (hit && it.contact_window) hit.dataset.contactWindow = String(it.contact_window);
        }
      });
      // 也按缓存重建一行文案
      (items || []).forEach((it) => {
        if (!it.contact_window) return;
        const hit =
          nodes.find((n) => String(n.dataset.id) === String(it.id)) ||
          nodes.find((n) => (n.querySelector("strong") || {}).textContent === it.title);
        if (!hit) return;
        hit.dataset.contactWindow = String(it.contact_window);
        if (!hit.querySelector(".ac-contact-window")) {
          const line = document.createElement("div");
          line.className = "muted ac-contact-window";
          line.textContent = "联系窗口：" + it.contact_window;
          hit.appendChild(line);
        }
      });
      echoContactWindows();
    } catch (_) {}
  };

  /* 6 · 大脑/图谱入口空态 */
  async function renderBrainEmpty() {
    const host = $("#brain") || $(".brain-hub");
    if (!host) return;
    let tip = $("#brainEmptyTip");
    try {
      const data = await api("/api/mindmap");
      const empty = !!(data.empty || data.has_saved === false);
      if (!empty) {
        if (tip) tip.remove();
        return;
      }
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "brainEmptyTip";
        tip.className = "card brain-empty-tip";
        const canvas = $("#brainMapFull");
        if (canvas && canvas.parentNode) canvas.parentNode.insertBefore(tip, canvas);
        else {
          const hub = $(".brain-hub") || host;
          hub.insertBefore(tip, hub.firstChild);
        }
      }
      const cta = data.cta || { go: "company", label: "先去公司盘点" };
      tip.innerHTML = emptyState(
        "图谱还是空白起点",
        data.empty_hint || "还没有保存过自己的图谱。可以从盘点或关系开始，再回来改节点。",
        cta.go || "company",
        cta.label || "先去公司盘点"
      );
    } catch (_) {}
  }

  const _refreshBrain = window.refreshBrain;
  window.refreshBrain = async function () {
    await _refreshBrain();
    await renderBrainEmpty();
  };

  /* 7 · ICU 一键写入后轻反馈 */
  function patchIcuApply() {
    const btn = $("#icuApply");
    if (!btn || btn.dataset.r12) return;
    btn.dataset.r12 = "1";
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
        softBanner("清册已写入交割", "icu");
        if (typeof refreshIcu === "function") await refreshIcu();
      } catch (e) {
        toast(e.message);
        if (typeof prev === "function") return prev.call(btn, ev);
      }
    };
  }

  /* 8 · 快照恢复确认 → 无 restore API：只读对比加强 + confirm */
  async function enhanceSnapshotCompare() {
    const box = $("#handoverBox");
    if (!box) return;
    let panel = $("#snapComparePanel");
    const snapCard = Array.from(box.querySelectorAll(".card")).find(
      (c) => ((c.querySelector("h3") || {}).textContent || "").includes("历史快照")
    );
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "snapComparePanel";
      panel.className = "card snap-compare-panel";
      if (snapCard) snapCard.appendChild(panel);
      else box.appendChild(panel);
    }
    try {
      const cmp = await api("/api/snapshots/compare");
      const snaps = await api("/api/snapshots").catch(() => ({ items: [] }));
      panel.innerHTML = `<h3>只读对比</h3>
        <p class="muted">${esc(cmp.text || "快照不足时，存两版即可温和对照。")}</p>
        <button type="button" class="btn ghost" id="snapCompareConfirm">查看对比详情</button>
        <div id="snapCompareDetail" class="snap-compare-detail" hidden></div>`;
      $("#snapCompareConfirm").onclick = async () => {
        const ok = await calmConfirm({
          title: "查看快照对比",
          body: "演示环境不覆盖当前手册，只打开只读对照。要继续吗？",
          okLabel: "打开对照",
        });
        if (!ok) return;
        const detail = $("#snapCompareDetail");
        if (!detail) return;
        const newer = cmp.newer || (snaps.items || [])[0];
        const older = cmp.older || (snaps.items || [])[1];
        detail.hidden = false;
        detail.innerHTML = `<div class="stat" style="margin-top:10px">
            <div class="box"><span class="muted">较新</span><b style="font-size:14px">${esc(
              (newer && (newer.label || "最近一版")) || "—"
            )}</b>
              <div class="muted">${newer && newer.item_count != null ? newer.item_count + " 条" : ""}</div>
            </div>
            <div class="box"><span class="muted">上一版</span><b style="font-size:14px">${esc(
              (older && (older.label || "上一版")) || "—"
            )}</b>
              <div class="muted">${older && older.item_count != null ? older.item_count + " 条" : ""}</div>
            </div>
          </div>
          <p class="muted" style="margin-top:8px">${esc(
            cmp.ready
              ? "条数差 " + (cmp.delta > 0 ? "+" : "") + (cmp.delta || 0) + " · 仅对照，不恢复覆盖。"
              : "再存一版后即可对照。"
          )}</p>`;
        softBanner("已打开只读对照", "handover");
      };
    } catch (_) {}
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await enhanceSnapshotCompare();
  };

  /* 9 · 医院列表国际患者筛选 chip */
  let _medIntl = false;
  function ensureMedIntlChip() {
    let bar = $("#medIntlChipBar");
    const region = $("#medRegionChips");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "medIntlChipBar";
    bar.className = "chip-row";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "国际患者筛选");
    bar.innerHTML = `<button type="button" class="chip ${_medIntl ? "active" : ""}" data-intl="1">国际患者</button>
      <button type="button" class="chip ${!_medIntl ? "active" : ""}" data-intl="">全部接待</button>`;
    if (region && region.parentNode) region.parentNode.insertBefore(bar, region.nextSibling);
    else {
      const list = $("#medList");
      if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    }
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-intl]");
      if (!btn) return;
      _medIntl = btn.dataset.intl === "1";
      $$("#medIntlChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.intl === "1") === _medIntl)
      );
      if (typeof refreshMed === "function") {
        refreshMed(
          ($("#medQ") && $("#medQ").value.trim()) || "",
          ($("#medCountry") && $("#medCountry").value) || ""
        );
      }
    });
    return bar;
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "", region) {
    ensureMedIntlChip();
    if (_medIntl) {
      try {
        const qs = new URLSearchParams();
        if (q) qs.set("q", q);
        if (country) qs.set("country", country);
        if (region) qs.set("region", region);
        qs.set("intl", "1");
        const [{ items }, intents] = await Promise.all([
          api("/api/hospitals?" + qs.toString()),
          api("/api/hospitals/intents").catch(() => ({ items: [] })),
        ]);
        // 先走默认渲染，再覆盖列表为 intl 结果
        await _refreshMed(q, country, region);
        const list = $("#medList");
        if (list) {
          list.innerHTML =
            (items || [])
              .map(
                (h) => `<div class="item">
      <span class="tag">${esc(h.country)}</span>
      ${h.intl ? '<span class="tag">国际患者</span>' : ""}
      <strong>${esc(h.name)}</strong>
      <div class="muted">${esc(h.city)} · ${esc(h.dept)}<br/>${esc(h.tags || "")}</div>
      <div class="row"><button class="btn secondary" data-hid="${h.id}" type="button">提交就医意向</button></div>
    </div>`
              )
              .join("") || "<p class='muted'>暂无国际患者友好医院</p>";
          $$("#medList [data-hid]").forEach((btn) => {
            btn.onclick = async () => {
              const note =
                ($("#medNote") && $("#medNote").value.trim()) ||
                "希望顾问协助评估就医路径";
              await api("/api/hospitals/intent", {
                method: "POST",
                body: JSON.stringify({ hospital_id: Number(btn.dataset.hid), note }),
              });
              toast("意向已提交");
              refreshMed(q, country, region);
            };
          });
        }
        return;
      } catch (_) {
        await _refreshMed(q, country, region);
        return;
      }
    }
    await _refreshMed(q, country, region);
  };

  /* 10 · 关于页隐私链接醒目 */
  function ensureAboutPrivacyBtn() {
    const box = $("#appAboutBox");
    if (!box || $("#aboutPrivacyBtn")) return;
    const btn = document.createElement("a");
    btn.id = "aboutPrivacyBtn";
    btn.className = "btn block about-privacy-btn";
    btn.href = "privacy.html";
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.textContent = "打开隐私说明（privacy.html）";
    const health = $("#aboutHealthBtn");
    if (health && health.parentNode) {
      health.parentNode.insertBefore(btn, health.nextSibling);
    } else {
      box.appendChild(btn);
    }
    const hint = document.createElement("p");
    hint.className = "muted about-privacy-hint";
    hint.style.marginTop = "8px";
    hint.textContent = "旁路托管边界与联系邮箱，一眼可打开。";
    btn.insertAdjacentElement("afterend", hint);
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "legacy") setTimeout(() => ensureLegacySelectAll(), 0);
    if (id === "assets" && typeof refreshAssets === "function") {
      /* due zone via refreshAssets */
    }
    if (id === "aftercare") {
      setTimeout(() => {
        ensureContactWindowField();
        patchAftercareSubmit();
      }, 0);
    }
    if (id === "icu") setTimeout(() => patchIcuApply(), 0);
    if (id === "brain") setTimeout(() => renderBrainEmpty(), 40);
    if (id === "med") setTimeout(() => ensureMedIntlChip(), 0);
    if (id === "appAbout") setTimeout(() => ensureAboutPrivacyBtn(), 0);
    if (id === "handover") setTimeout(() => enhanceSnapshotCompare(), 40);
  };

  // boot
  bindMemberPill();
  ensureContactWindowField();
  patchAftercareSubmit();
  patchIcuApply();
  ensureAboutPrivacyBtn();
  ensureMedIntlChip();
  ensureLegacySelectAll();
})();
