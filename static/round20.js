/* 电子继承 · 第二十批增量（叠在 round19…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  let _lgClearOnly = false;
  let _avFocusAfterUpload = false;

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round20SoftBanner_" + (hostId || "home");
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
    }, 8000);
    return el;
  }

  function goCompanyDept(deptId) {
    const id = String(deptId || "admin");
    if (typeof show === "function") show("company");
    setTimeout(() => {
      $$("#companyBox .card.dept-highlight").forEach((c) =>
        c.classList.remove("dept-highlight")
      );
      const el = document.getElementById("dept-" + id);
      if (!el) return;
      el.classList.add("dept-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  /* 1 · 首页二十批功能就绪角标 */
  function paintHomeRound20Ready() {
    const home = $("#home");
    if (!home) return;
    let badge = $("#homeRound20Ready");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "homeRound20Ready";
      badge.className = "home-round20-ready";
      badge.setAttribute("role", "status");
      const hint = $("#homeHint");
      const progress = $("#homeLegacyProgress");
      if (progress && progress.parentNode === home) {
        progress.insertAdjacentElement("afterend", badge);
      } else if (hint && hint.parentNode === home) {
        hint.insertAdjacentElement("afterend", badge);
      } else {
        const strip = $("#todayCheckin");
        if (strip && strip.parentNode === home) strip.insertAdjacentElement("afterend", badge);
        else home.appendChild(badge);
      }
    }
    badge.innerHTML =
      '<span class="home-round20-ready-mark">体验层已就绪</span>' +
      '<span class="muted home-round20-ready-sub">电子继承 App · 可按自己节奏使用</span>';
    badge.hidden = false;
  }

  /* 2 · 交割清除照片/聊天未勾汇总 */
  async function paintMissingClearBar() {
    const list = $("#lgList");
    if (!list) return;
    let bar = $("#lgMissingClearBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lgMissingClearBar";
      bar.className = "lg-missing-clear-bar";
      const missFr = $("#lgMissingFactoryBar");
      const missBene = $("#lgMissingBeneBar");
      const filter = $("#lgFilterBar") || $("#lgDeptFilter");
      if (missFr && missFr.parentNode) missFr.insertAdjacentElement("afterend", bar);
      else if (missBene && missBene.parentNode) missBene.insertAdjacentElement("afterend", bar);
      else if (filter && filter.parentNode) filter.parentNode.insertBefore(bar, filter);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const pending = await api("/api/legacy/missing-clear-media");
      const n = Number(pending.count || 0);
      if (!n) {
        bar.hidden = true;
        bar.innerHTML = "";
        _lgClearOnly = false;
        return;
      }
      bar.hidden = false;
      bar.innerHTML = `<span>${esc(
        pending.hint || "有 " + n + " 条设备安排还没勾选清除照片或聊天"
      )}</span>
        <button type="button" class="btn ghost sm" id="lgClearFilterBtn">${
          _lgClearOnly ? "显示全部" : "筛出未勾选"
        }</button>`;
      const btn = $("#lgClearFilterBtn");
      if (btn) {
        btn.onclick = () => {
          _lgClearOnly = !_lgClearOnly;
          applyMissingClearFilter(pending.items || []);
          paintMissingClearBar();
        };
      }
      if (_lgClearOnly) applyMissingClearFilter(pending.items || []);
    } catch (_) {}
  }

  function applyMissingClearFilter(pendingItems) {
    const ids = new Set((pendingItems || []).map((x) => Number(x.id)));
    $$("#lgList .item[data-id]").forEach((el) => {
      if (!_lgClearOnly) {
        el.hidden = false;
        return;
      }
      el.hidden = !ids.has(Number(el.dataset.id));
    });
    let tip = $("#lgClearOnlyTip");
    if (_lgClearOnly) {
      const visible = $$("#lgList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "lgClearOnlyTip";
          tip.className = "muted";
          $("#lgList") && $("#lgList").appendChild(tip);
        }
        tip.textContent = "没有未勾选清除照片/聊天的设备条目了。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    await paintMissingClearBar();
  };

  /* 3 · 备忘→部门盘点深链 */
  function enhanceAssetsToCompany() {
    const list = $("#asList");
    if (!list) return;
    $$("#asList .item").forEach((el) => {
      if (el.querySelector(".as-to-company")) return;
      const dept = el.dataset.dept || "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-to-company";
      btn.textContent = "去盘点";
      btn.title = "跳转到公司化对应部门";
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        let target = dept;
        try {
          if (!target && el.dataset.id) {
            const data = await api("/api/assets");
            const it = (data.items || []).find(
              (x) => String(x.id) === String(el.dataset.id)
            );
            if (it && it.dept) target = String(it.dept);
          }
        } catch (_) {}
        goCompanyDept(target || "admin");
      };
      let row = el.querySelector(".row");
      if (!row) {
        row = document.createElement("div");
        row.className = "row";
        row.style.cssText = "gap:6px;flex-wrap:wrap;margin-top:8px";
        el.appendChild(row);
      }
      const legacyBtn = el.querySelector(".as-to-legacy");
      if (legacyBtn && legacyBtn.parentNode === row) {
        legacyBtn.insertAdjacentElement("afterend", btn);
      } else {
        row.appendChild(btn);
      }
    });
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    try {
      const { items } = await api("/api/assets");
      const nodes = $$("#asList .item");
      (items || []).forEach((it, i) => {
        const el = nodes[i];
        if (!el) return;
        if (it.id != null) el.dataset.id = String(it.id);
        if (it.dept) el.dataset.dept = String(it.dept);
      });
    } catch (_) {}
    enhanceAssetsToCompany();
  };

  /* 4 · 报备页会员有效同行 */
  async function paintCheckinMemberPeer() {
    const box = $("#checkinBox");
    if (!box) return;
    let peer = $("#checkinMemberPeer");
    try {
      const gentle = await api("/api/membership/gentle");
      if (!peer) {
        peer = document.createElement("div");
        peer.id = "checkinMemberPeer";
        peer.className = "checkin-member-peer muted";
        peer.setAttribute("role", "status");
        const first = box.querySelector(".card, .status-card");
        if (first) first.insertAdjacentElement("beforebegin", peer);
        else box.insertBefore(peer, box.firstChild);
      }
      if (gentle.is_member) {
        const until = gentle.member_until_iso || "";
        const days =
          gentle.days_left != null ? " · 约剩 " + gentle.days_left + " 天" : "";
        peer.textContent =
          "会员有效期至 " + (until || "演示期内") + days + "（只读对照）";
      } else {
        peer.textContent = "会员尚未开通（演示）；报备仍可按自己节奏使用。";
      }
    } catch (_) {
      if (peer) peer.textContent = "";
    }
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    await paintCheckinMemberPeer();
  };

  /* 5 · 差旅充值成功回首页 CTA */
  function bindTravelHomeCta() {
    const btn = $("#travelPay");
    if (!btn || btn.dataset.r20home) return;
    btn.dataset.r20home = "1";
    btn.onclick = async function () {
      const amount = Number(($("#travelAmt") && $("#travelAmt").value) || 0);
      if (!(amount > 0)) {
        toast("请填写充值金额");
        return;
      }
      try {
        await api("/api/travel-fund", {
          method: "POST",
          body: JSON.stringify({ amount, force: amount < 2000 }),
        });
        toast("预存成功");
        softBanner("差旅预存已记入，可回首页继续安排。", "travel", [
          {
            label: "回首页",
            onClick: () => {
              if (typeof show === "function") show("home");
            },
          },
        ]);
        softBanner(
          "差旅预存已记入，可按自己的节奏继续安排。",
          "home"
        );
        if (typeof refreshTravel === "function") refreshTravel();
      } catch (err) {
        toast(err.message || "预存未完成");
      }
    };
  }

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    bindTravelHomeCta();
  };

  /* 6 · 善后工单预算合计条（未完成 vs 余额） */
  async function paintOpenBudgetBar() {
    const list = $("#acList");
    if (!list || !list.parentNode) return;
    let bar = $("#acOpenBudgetBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "acOpenBudgetBar";
      bar.className = "ac-open-budget-bar";
      bar.setAttribute("role", "status");
      const empty = $("#acEmptyDualCta");
      if (empty && empty.parentNode) empty.insertAdjacentElement("beforebegin", bar);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const data = await api("/api/aftercare/open-budget-sum");
      const n = Number(data.open_count || 0);
      if (!n) {
        bar.hidden = true;
        bar.textContent = "";
        return;
      }
      bar.hidden = false;
      bar.textContent =
        data.hint ||
        "未完成工单预算合计约 ¥" +
          Number(data.budget_sum || 0).toFixed(0) +
          "，当前预存 ¥" +
          Number(data.balance || 0).toFixed(0);
    } catch (_) {
      bar.hidden = true;
    }
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    await paintOpenBudgetBar();
  };

  /* 7 · 授权视频上传成功聚焦列表 */
  function focusActiveAuthItem(st) {
    const status = st || null;
    if (!status) return;
    const active =
      (status.items || []).find((it) => it.current_active) ||
      (status.items || []).find(
        (it) => Number(it.id) === Number(status.current_active_id)
      ) ||
      (status.items || [])[0] ||
      null;
    const summary = $("#avActiveSummary");
    if (summary) {
      summary.classList.add("av-focus-flash");
      setTimeout(() => summary.classList.remove("av-focus-flash"), 2200);
      if (typeof summary.scrollIntoView === "function") {
        summary.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    const list = $("#avList");
    if (!list || !active) return;
    const name = String(active.original_name || active.filename || "").trim();
    let hit = null;
    $$("#avList .item").forEach((el) => {
      const strong = ((el.querySelector("strong") || {}).textContent || "").trim();
      if (name && strong === name) hit = el;
      if (
        active.id != null &&
        el.dataset.id &&
        String(el.dataset.id) === String(active.id)
      ) {
        hit = el;
      }
    });
    if (!hit && $$("#avList .item").length) hit = $$("#avList .item")[0];
    if (hit) {
      hit.classList.add("av-item-focus");
      setTimeout(() => hit.classList.remove("av-item-focus"), 2400);
      if (typeof hit.scrollIntoView === "function") {
        hit.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function bindAuthUploadFocus() {
    const btn = $("#avUpload");
    if (!btn || btn.dataset.r20focus) return;
    btn.dataset.r20focus = "1";
    const prev = btn.onclick;
    btn.onclick = async function (e) {
      const file = $("#avFile") && $("#avFile").files && $("#avFile").files[0];
      const checks =
        $("#avGreet") &&
        $("#avGreet").checked &&
        $("#avAuth") &&
        $("#avAuth").checked &&
        $("#avPlan") &&
        $("#avPlan").checked;
      if (file && checks) _avFocusAfterUpload = true;
      try {
        if (typeof prev === "function") await prev.call(this, e);
      } catch (_) {
        _avFocusAfterUpload = false;
      }
      // 失败时 app.js 不抛错也不 refresh：短时后清旗，避免下次误聚焦
      setTimeout(() => {
        _avFocusAfterUpload = false;
      }, 2500);
    };
  }

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    bindAuthUploadFocus();
    if (_avFocusAfterUpload) {
      _avFocusAfterUpload = false;
      try {
        const st = await api("/api/auth-video");
        focusActiveAuthItem(st);
      } catch (_) {}
    }
  };

  /* 8 · 手册页执行人缺席双 CTA */
  async function paintHandoverExecutorDualCta() {
    const tip = $("#handExecutorMissingTip");
    const box = $("#handoverBox") || $("#handover");
    if (!box) return;
    try {
      const data = await api("/api/handover/print-checklist");
      if (data.executor_filled) {
        const dual = $("#handExecutorDualCta");
        if (dual) dual.remove();
        return;
      }
      let dual = $("#handExecutorDualCta");
      if (!dual) {
        dual = document.createElement("div");
        dual.id = "handExecutorDualCta";
        dual.className = "ok soft-banner soft-banner-cta hand-executor-dual";
        if (tip && tip.parentNode) tip.insertAdjacentElement("afterend", dual);
        else {
          const first = box.querySelector(".card");
          if (first) first.insertAdjacentElement("beforebegin", dual);
          else box.insertBefore(dual, box.firstChild);
        }
      }
      dual.innerHTML = `<span>尚未填写执行人。可先到设置里写上，或去看看加盟意向。</span>
        <button type="button" class="btn ghost sm" id="handExGoSettings">去设置</button>
        <button type="button" class="btn ghost sm" id="handExGoLead">去加盟意向</button>`;
      const goSet = $("#handExGoSettings");
      if (goSet) {
        goSet.onclick = () => {
          if (typeof show === "function") show("checkin");
          setTimeout(() => {
            const el = $("#executorName");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.focus();
            }
          }, 80);
        };
      }
      const goLead = $("#handExGoLead");
      if (goLead) {
        goLead.onclick = () => {
          if (typeof show === "function") show("executor");
        };
      }
      // Hide single-CTA tip if dual is present (avoid duplicate)
      if (tip) tip.hidden = true;
    } catch (_) {}
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await paintHandoverExecutorDualCta();
  };

  /* 9 · 医旅收藏空态引导 */
  function paintMedFavEmptyCta() {
    const entry = $("#medFavEntry");
    const body = $("#medFavEntryBody");
    const panel = $("#med");
    if (!panel) return;

    function favIds() {
      try {
        const raw = localStorage.getItem("einherit_med_favs");
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (_) {
        return [];
      }
    }

    let empty = $("#medFavEmptyCta");
    const n = favIds().length;
    if (n > 0) {
      if (empty) empty.remove();
      return;
    }
    if (!empty) {
      empty = document.createElement("div");
      empty.id = "medFavEmptyCta";
      empty.className = "med-fav-empty-cta";
    }
    empty.innerHTML = `<p class="muted">还没有本机收藏。可以先去搜索医院，找到合适的再收藏。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <button type="button" class="btn ghost sm" id="medFavEmptySearch">去搜索医院</button>
      </div>`;
    if (body && !body.hidden) {
      const plain = body.querySelector("p.muted");
      if (plain && /还没有收藏/.test(plain.textContent || "")) plain.replaceWith(empty);
      else if (!empty.parentNode || empty.parentNode !== body) {
        body.innerHTML = "";
        body.appendChild(empty);
      }
    } else if (entry) {
      if (!empty.parentNode || empty.parentNode !== entry) {
        const existing = entry.querySelector("#medFavEmptyCta");
        if (!existing) entry.appendChild(empty);
      }
    } else {
      const list = $("#medList");
      if (list && list.parentNode) list.parentNode.insertBefore(empty, list);
      else panel.appendChild(empty);
    }
    const btn = $("#medFavEmptySearch");
    if (btn) {
      btn.onclick = () => {
        if (typeof show === "function") show("med");
        setTimeout(() => {
          const q = $("#medQ");
          if (q) {
            q.focus();
            q.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 40);
      };
    }
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q, country, region) {
    await _refreshMed(q, country, region);
    setTimeout(paintMedFavEmptyCta, 60);
  };

  /* 10 · 设置·导出与导入入口并排 */
  function enhanceBackupIoLayout() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#backupIoCard");
    const exportCard = $("#backupExportCard");
    // Find import card by heading
    let importCard = null;
    $$("#settingsBox .card").forEach((c) => {
      const h = c.querySelector("h3");
      if (h && /数据导入/.test(h.textContent || "")) importCard = c;
    });
    if (!card) {
      card = document.createElement("div");
      card.id = "backupIoCard";
      card.className = "card backup-io-card";
      if (exportCard && exportCard.parentNode) {
        exportCard.insertAdjacentElement("beforebegin", card);
      } else if (importCard && importCard.parentNode) {
        importCard.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    card.innerHTML = `<h3>备份导出与导入</h3>
      <p class="muted">演示级本机备份。导出与导入放在一起，方便对照；非云同步。</p>
      <div class="backup-io-grid">
        <div class="backup-io-col" id="backupIoExportSlot"></div>
        <div class="backup-io-col" id="backupIoImportSlot"></div>
      </div>`;
    const exportSlot = $("#backupIoExportSlot");
    const importSlot = $("#backupIoImportSlot");
    if (exportCard && exportSlot) {
      // Move export controls into slot
      const title = exportCard.querySelector("h3");
      if (title) title.remove();
      const muted = exportCard.querySelector("p.muted");
      // keep first muted as sublabel inside slot
      exportSlot.innerHTML = `<h4>导出</h4>`;
      while (exportCard.firstChild) exportSlot.appendChild(exportCard.firstChild);
      exportCard.remove();
    } else if (exportSlot && !exportSlot.querySelector("#backupDownloadBtn")) {
      exportSlot.innerHTML = `<h4>导出</h4>
        <p class="muted">打包交割、备忘、受益人与工单摘要。</p>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button type="button" class="btn" id="backupDownloadBtn">下载备份 JSON</button>
          <button type="button" class="btn ghost" id="backupCopyBtn">复制备份 JSON</button>
        </div>
        <p class="muted" id="backupExportHint" style="margin-top:8px"></p>`;
      bindBackupExportButtons();
    }
    if (importCard && importSlot) {
      const title = importCard.querySelector("h3");
      if (title) title.remove();
      importSlot.innerHTML = `<h4>导入</h4>`;
      while (importCard.firstChild) importSlot.appendChild(importCard.firstChild);
      importCard.remove();
    } else if (importSlot && !importSlot.querySelector("#importPackJson")) {
      importSlot.innerHTML = `<h4>导入</h4>
        <p class="muted">与 JSON 导出对称。先预览条数，确认后再写入。</p>
        <label class="field">粘贴导出 JSON<textarea id="importPackJson" rows="4" placeholder='{"legacy":[],"assets":[],"beneficiaries":[]}'></textarea></label>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn ghost" id="importPreview" type="button">预览</button>
          <button class="btn" id="importConfirm" type="button">确认导入</button>
        </div>
        <p class="muted" id="importResult" style="margin-top:8px"></p>`;
      bindImportButtons();
    }
  }

  function bindBackupExportButtons() {
    const downloadBtn = $("#backupDownloadBtn");
    const copyBtn = $("#backupCopyBtn");
    if (downloadBtn && !downloadBtn.dataset.r20bound) {
      downloadBtn.dataset.r20bound = "1";
      downloadBtn.onclick = async () => {
        try {
          const pack = await api("/api/export/backup");
          const text = JSON.stringify(pack, null, 2);
          const blob = new Blob([text], { type: "application/json" });
          const a = document.createElement("a");
          const stamp =
            (pack.exported_at || "").replace(/[:T]/g, "") || String(Date.now());
          a.href = URL.createObjectURL(blob);
          a.download = `einherit-backup-${stamp}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
          const hint = $("#backupExportHint");
          if (hint) hint.textContent = pack.backup_note || "已下载。非云同步。";
          softBanner("备份已下载（本机文件，非云同步）", "settings");
          toast("备份已下载");
        } catch (e) {
          toast(e.message);
        }
      };
    }
    if (copyBtn && !copyBtn.dataset.r20bound) {
      copyBtn.dataset.r20bound = "1";
      copyBtn.onclick = async () => {
        try {
          const pack = await api("/api/export/backup");
          const text = JSON.stringify(pack, null, 2);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
          }
          const hint = $("#backupExportHint");
          if (hint) hint.textContent = pack.backup_note || "已复制。非云同步。";
          softBanner("备份 JSON 已复制（非云同步）", "settings");
          toast("已复制备份 JSON");
        } catch (e) {
          toast(e.message);
        }
      };
    }
  }

  function bindImportButtons() {
    const runImport = async (confirm) => {
      const raw = (($("#importPackJson") && $("#importPackJson").value) || "").trim();
      if (!raw) return toast("请先粘贴 JSON");
      let pack;
      try {
        pack = JSON.parse(raw);
      } catch {
        return toast("JSON 格式不正确");
      }
      try {
        const r = await api("/api/export/import", {
          method: "POST",
          body: JSON.stringify({ pack, confirm }),
        });
        const out = $("#importResult");
        if (out) {
          out.textContent = confirm
            ? r.message || "已导入"
            : `预览：交割 ${r.preview.legacy_count} · 备忘 ${r.preview.assets_count} · 受益人 ${r.preview.beneficiaries_count}`;
        }
        toast(confirm ? "导入完成" : "已生成预览，确认无误后再导入");
      } catch (err) {
        toast(err.message);
      }
    };
    const prev = $("#importPreview");
    const conf = $("#importConfirm");
    if (prev && !prev.dataset.r20bound) {
      prev.dataset.r20bound = "1";
      prev.onclick = () => runImport(false);
    }
    if (conf && !conf.dataset.r20bound) {
      conf.dataset.r20bound = "1";
      conf.onclick = () => runImport(true);
    }
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(paintHomeRound20Ready, 0);
    if (id === "legacy") setTimeout(() => paintMissingClearBar().catch(() => {}), 40);
    if (id === "assets") setTimeout(enhanceAssetsToCompany, 80);
    if (id === "checkin") setTimeout(() => paintCheckinMemberPeer().catch(() => {}), 60);
    if (id === "travel") setTimeout(bindTravelHomeCta, 40);
    if (id === "aftercare") setTimeout(() => paintOpenBudgetBar().catch(() => {}), 40);
    if (id === "authvideo") setTimeout(bindAuthUploadFocus, 40);
    if (id === "handover")
      setTimeout(() => paintHandoverExecutorDualCta().catch(() => {}), 80);
    if (id === "med") setTimeout(paintMedFavEmptyCta, 80);
    if (id === "settings") {
      setTimeout(enhanceBackupIoLayout, 120);
      setTimeout(enhanceBackupIoLayout, 400);
    }
  };

  // Boot
  paintHomeRound20Ready();
  if ($("#home") && $("#home").classList.contains("active")) {
    paintHomeRound20Ready();
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    paintOpenBudgetBar().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    bindAuthUploadFocus();
  }
})();
