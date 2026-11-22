/* 电子继承 · 第十六批增量（叠在 round15…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const FAV_KEY = "einherit_med_favs";
  const DISPOSE_TO_ACTION = [
    { re: /变现|销售/, action: "销售变现" },
    { re: /转赠/, action: "销毁数据后转赠" },
    { re: /销毁/, action: "销毁" },
  ];

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round16SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
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

  function emptyStateDual(title, hint, actions) {
    const btns = (actions || [])
      .map(
        (a) =>
          `<button class="btn ghost sm" data-go="${esc(a.go)}" type="button">${esc(
            a.label
          )}</button>`
      )
      .join("");
    return `<div class="empty-state lg-empty-guide">
      <p class="empty-title">${esc(title)}</p>
      <p class="empty-hint">${esc(hint)}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">${btns}</div>
    </div>`;
  }

  function getFavs() {
    try {
      const raw = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(Number).filter((n) => n > 0) : [];
    } catch (_) {
      return [];
    }
  }

  function setFavs(ids) {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids || []));
  }

  function toggleFav(id) {
    const n = Number(id);
    if (!n) return getFavs();
    const cur = getFavs();
    const i = cur.indexOf(n);
    if (i >= 0) cur.splice(i, 1);
    else cur.push(n);
    setFavs(cur);
    return cur;
  }

  function disposeToAction(note) {
    const s = String(note || "").trim();
    for (const m of DISPOSE_TO_ACTION) {
      if (m.re.test(s)) return m.action;
    }
    return s || "销毁";
  }

  /* 1 · 首页健康角标 */
  async function paintHomeHealthBadge() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeHealthBadge");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeHealthBadge";
      bar.className = "home-health-badge";
      bar.setAttribute("role", "status");
      bar.hidden = true;
      const head = home.querySelector(".panel-head") || home.firstChild;
      if (head && head.parentNode === home) head.insertAdjacentElement("afterend", bar);
      else home.insertBefore(bar, home.firstChild);
    }
    try {
      const h = await api("/api/health");
      if (h && h.ok) {
        bar.hidden = true;
        bar.textContent = "";
        return;
      }
      bar.hidden = false;
      bar.className = "home-health-badge is-soft";
      bar.textContent = "服务暂不可用";
    } catch (_) {
      bar.hidden = false;
      bar.className = "home-health-badge is-soft";
      bar.textContent = "服务暂不可用";
    }
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    await paintHomeHealthBadge();
  };

  /* 2 · 交割空列表引导 */
  function paintLegacyEmptyGuide() {
    const list = $("#lgList");
    if (!list) return;
    const items = $$("#lgList .item");
    const hasItems = items.some((el) => !el.hidden);
    if (hasItems) {
      const guide = $("#lgEmptyGuide");
      if (guide) guide.remove();
      return;
    }
    // Replace muted/empty-state with dual CTA
    list.innerHTML = emptyStateDual(
      "交割清单还是空的",
      "可以从五部门盘点慢慢补，或先生成急症清册，给执行人一份冷静起点。",
      [
        { go: "company", label: "去盘点" },
        { go: "icu", label: "急症清册" },
      ]
    );
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    try {
      const { items } = await api("/api/legacy");
      if (!(items || []).length) paintLegacyEmptyGuide();
    } catch (_) {
      paintLegacyEmptyGuide();
    }
  };

  /* 3 · 备忘→交割一键带入 */
  function mapAssetToLegacyPrefill(it) {
    return {
      title: it.platform || it.title || "",
      dept: it.dept || "admin",
      action: disposeToAction(it.dispose_note),
      notes: it.summary || it.account_hint || "",
    };
  }

  function applyLegacyPrefill(pre) {
    if ($("#lgTitle")) $("#lgTitle").value = pre.title || "";
    if ($("#lgDept") && pre.dept) $("#lgDept").value = pre.dept;
    if ($("#lgAction") && pre.action) {
      const sel = $("#lgAction");
      const opts = Array.from(sel.options || []);
      const hit = opts.find((o) => o.value === pre.action || o.textContent === pre.action);
      if (hit) sel.value = hit.value;
      else sel.value = pre.action;
    }
    if ($("#lgNotes") && pre.notes) $("#lgNotes").value = pre.notes;
    if ($("#lgCat") && !$("#lgCat").value) $("#lgCat").value = "其他";
  }

  function enhanceAssetsToLegacy() {
    const list = $("#asList");
    if (!list) return;
    $$("#asList .item").forEach((el) => {
      if (el.querySelector(".as-to-legacy")) return;
      const id = el.dataset.id;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-to-legacy";
      btn.textContent = "写入交割";
      btn.title = "预填交割表单，不自动提交";
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          let it = null;
          if (id) {
            const data = await api("/api/assets");
            it = (data.items || []).find((x) => String(x.id) === String(id));
          }
          if (!it) {
            const strong = el.querySelector("strong");
            const platform = (strong && strong.textContent) || "";
            const muted = el.querySelectorAll(".muted");
            let dispose = "";
            muted.forEach((m) => {
              const t = m.textContent || "";
              if (t.includes("处置指引")) dispose = t.replace(/^.*处置指引[：:]\s*/, "");
            });
            it = {
              platform,
              dispose_note: /尚未填写/.test(dispose) ? "" : dispose,
              dept: el.dataset.dept || "admin",
            };
          }
          const pre = mapAssetToLegacyPrefill(it);
          if (typeof show === "function") show("legacy");
          setTimeout(() => {
            applyLegacyPrefill(pre);
            softBanner("已从备忘带入交割表单，确认后点「写入交割手册」即可。", "legacy");
            const form = $("#lgTitle");
            if (form) form.focus();
          }, 40);
        } catch (err) {
          toast(err.message || "带入失败");
        }
      };
      const row = el.querySelector(".row") || el;
      if (row.classList && row.classList.contains("row")) row.appendChild(btn);
      else {
        const wrap = document.createElement("div");
        wrap.className = "row";
        wrap.style.cssText = "gap:6px;flex-wrap:wrap;margin-top:8px";
        wrap.appendChild(btn);
        el.appendChild(wrap);
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
        el.dataset.id = String(it.id || "");
        if (it.dept) el.dataset.dept = String(it.dept);
      });
    } catch (_) {}
    enhanceAssetsToLegacy();
  };

  /* 4 · 报备备用联系人编辑入口醒目 */
  async function paintBackupMissingCta() {
    const box = $("#checkinBox");
    if (!box) return;
    let tip = $("#backupMissingCta");
    try {
      const data = await api("/api/backup-contacts/summary");
      const count = Number(data.count || 0);
      if (count > 0) {
        if (tip) tip.remove();
        return;
      }
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "backupMissingCta";
        tip.className = "ok soft-banner soft-banner-cta backup-missing-cta";
        const summary = $("#backupSummaryCard");
        if (summary && summary.parentNode) {
          summary.insertAdjacentElement("afterend", tip);
        } else {
          const first = box.querySelector(".card");
          if (first) first.insertAdjacentElement("afterend", tip);
          else box.appendChild(tip);
        }
      }
      tip.innerHTML = "";
      const span = document.createElement("span");
      span.textContent = "尚未填写备用联系人。可先留一位，升级时会按序温和联系。";
      tip.appendChild(span);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = "去设置";
      btn.onclick = () => {
        const target = $("#bkNameNew") || $("#saveBackup");
        if (target && typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if ($("#bkNameNew")) {
          $("#bkNameNew").focus();
          const card = $("#bkNameNew").closest(".card");
          if (card) {
            card.classList.add("backup-focus");
            setTimeout(() => card.classList.remove("backup-focus"), 2400);
          }
        }
      };
      tip.appendChild(btn);
    } catch (_) {}
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    await paintBackupMissingCta();
  };

  /* 5 · 差旅余额不足开单拦截提示 */
  function patchAftercareBudgetConfirm() {
    const btn = $("#acAdd");
    if (!btn || btn.dataset.r16budget) return;
    btn.dataset.r16budget = "1";
    const prev = btn.onclick;
    btn.onclick = async function (ev) {
      try {
        const budget = Number(($("#acTravel") && $("#acTravel").value) || 0);
        if (budget > 0) {
          const hint = await api(
            "/api/aftercare/budget-hint?budget=" + encodeURIComponent(String(budget))
          );
          if (hint && hint.within_balance === false) {
            const ok = await calmConfirm({
              title: "差旅预算略高于余额",
              body:
                hint.text ||
                "当前工单差旅预算高于预存余额。仍可提交，之后可按自己的节奏补存；断缴退款流程不变。",
              okLabel: "仍然提交",
            });
            if (!ok) return;
          }
        }
      } catch (_) {
        /* 对照失败不挡提交 */
      }
      if (typeof prev === "function") return prev.call(btn, ev);
    };
  }

  /* 6 · 善后失联态转报备深链 */
  function annotateUnreachableToCheckin(items) {
    const nodes = $$("#acList .item");
    (items || []).forEach((it, i) => {
      let el =
        nodes.find((n) => String(n.dataset.id || "") === String(it.id || "")) || nodes[i];
      if (!el) return;
      el.dataset.id = String(it.id || "");
      el.dataset.coop = String(it.coop_state || "");
      const existing = el.querySelector(".ac-unreachable-cta");
      if (String(it.coop_state || "") !== "unreachable") {
        if (existing) existing.remove();
        return;
      }
      if (existing) return;
      const row = document.createElement("div");
      row.className = "row ac-unreachable-cta";
      row.style.cssText = "gap:8px;flex-wrap:wrap;margin-top:8px";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = "去报备";
      btn.onclick = () => {
        if (typeof show === "function") show("checkin");
      };
      const hint = document.createElement("span");
      hint.className = "muted";
      hint.textContent = "客户失联时，可先走报备升级，不改外呼流程。";
      row.appendChild(btn);
      row.appendChild(hint);
      el.appendChild(row);
    });
  }

  /* 7 · 授权视频未通过时开单禁用说明 */
  async function paintAuthGateReason() {
    const btn = $("#acAdd");
    if (!btn) return;
    let tip = $("#acAuthDisableReason");
    if (!tip) {
      tip = document.createElement("p");
      tip.id = "acAuthDisableReason";
      tip.className = "muted ac-auth-disable-reason";
      btn.insertAdjacentElement("afterend", tip);
    }
    try {
      const st = await api("/api/auth-video");
      const ready = !!(st.ready || st.complete);
      btn.disabled = !ready;
      if (ready) {
        tip.hidden = true;
        tip.textContent = "";
        btn.removeAttribute("aria-describedby");
        return;
      }
      tip.hidden = false;
      tip.id = "acAuthDisableReason";
      btn.setAttribute("aria-describedby", "acAuthDisableReason");
      tip.textContent =
        st.missing_text ||
        st.complete_label ||
        "授权视频门槛未齐，暂不可提交善后工单。";
    } catch (_) {
      tip.hidden = false;
      tip.textContent = "授权状态暂不可用，稍后再试开单。";
    }
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    patchAftercareBudgetConfirm();
    await paintAuthGateReason();
    try {
      const data = await api("/api/aftercare");
      annotateUnreachableToCheckin(data.items || []);
    } catch (_) {}
  };

  /* 8 · 手册导出前缺执行人提示 */
  async function paintHandoverExecutorTip() {
    const box = $("#handoverBox");
    const panel = $("#handover");
    if (!box && !panel) return;
    let tip = $("#handExecutorMissingTip");
    try {
      const data = await api("/api/handover/print-checklist");
      const ok = !!data.executor_filled;
      if (ok) {
        if (tip) tip.remove();
        return;
      }
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "handExecutorMissingTip";
        tip.className = "ok soft-banner soft-banner-cta hand-executor-missing";
        const host = box || panel;
        const first = host.querySelector(".card");
        if (first) first.insertAdjacentElement("beforebegin", tip);
        else host.insertBefore(tip, host.firstChild);
      }
      tip.innerHTML = "";
      const span = document.createElement("span");
      span.textContent = "导出前尚未填写执行人姓名。可先到设置里写上，再打印手册。";
      tip.appendChild(span);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = "去设置";
      btn.onclick = () => {
        if (typeof show === "function") show("checkin");
        setTimeout(() => {
          const el = $("#executorName");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
          }
        }, 80);
      };
      tip.appendChild(btn);
    } catch (_) {}
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await paintHandoverExecutorTip();
  };

  /* 9 · 医旅医院详情收藏本机 */
  async function openMedDetail(hid) {
    const id = Number(hid);
    if (!id) return;
    if (typeof show === "function") show("medDetail");
    const box = $("#medDetailBox");
    if (!box) return;
    box.innerHTML = "<p class='muted'>加载医院详情…</p>";
    try {
      const data = await api("/api/hospitals?id=" + encodeURIComponent(String(id)));
      const h = data.item || data;
      const favs = getFavs();
      const starred = favs.includes(Number(h.id));
      box.innerHTML = `<div class="card med-detail-card">
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center">
          <span class="tag">${esc(h.country || "")}</span>
          ${h.intl ? '<span class="tag">国际患者</span>' : ""}
          ${starred ? '<span class="tag fav-tag">已收藏</span>' : ""}
        </div>
        <h3 style="margin-top:10px">${esc(h.name || "医院")}</h3>
        <p class="muted">${esc(h.city || "")} · ${esc(h.dept || "")}</p>
        <p class="muted">${esc(h.address || h.tags || "演示信息，非疗效承诺。")}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
          <button type="button" class="btn ghost sm" id="medDetailFavBtn">${
            starred ? "取消收藏" : "收藏本机"
          }</button>
          <button type="button" class="btn secondary" id="medDetailIntentBtn">提交就医意向</button>
          <button type="button" class="btn ghost sm" data-go="med">返回列表</button>
        </div>
        <p class="muted" style="margin-top:10px">收藏仅保存在本机浏览器，便于下次快速打开。</p>
      </div>`;
      const favBtn = $("#medDetailFavBtn");
      if (favBtn) {
        favBtn.onclick = () => {
          toggleFav(h.id);
          toast(getFavs().includes(Number(h.id)) ? "已收藏到本机" : "已取消收藏");
          openMedDetail(h.id);
          paintMedFavList().catch(() => {});
        };
      }
      const intentBtn = $("#medDetailIntentBtn");
      if (intentBtn) {
        intentBtn.onclick = async () => {
          try {
            const note =
              ($("#medNote") && $("#medNote").value.trim()) ||
              "希望顾问协助评估就医路径";
            await api("/api/hospitals/intent", {
              method: "POST",
              body: JSON.stringify({ hospital_id: Number(h.id), note }),
            });
            toast("意向已提交");
          } catch (e) {
            toast(e.message);
          }
        };
      }
    } catch (e) {
      box.innerHTML = `<p class="muted">详情暂不可用：${esc(e.message)}</p>`;
    }
  }

  async function paintMedFavList() {
    const panel = $("#med");
    if (!panel) return;
    let card = $("#medFavListCard");
    const favs = getFavs();
    if (!favs.length) {
      if (card) card.remove();
      return;
    }
    if (!card) {
      card = document.createElement("div");
      card.id = "medFavListCard";
      card.className = "card med-fav-list-card";
      const list = $("#medList");
      if (list && list.parentNode) list.parentNode.insertBefore(card, list);
      else panel.appendChild(card);
    }
    try {
      const { items } = await api("/api/hospitals");
      const map = {};
      (items || []).forEach((h) => {
        map[Number(h.id)] = h;
      });
      const rows = favs
        .map((id) => map[id])
        .filter(Boolean)
        .map(
          (h) => `<div class="item med-fav-row" data-hid="${esc(String(h.id))}">
            <span class="tag fav-tag">收藏</span>
            <strong>${esc(h.name || "")}</strong>
            <div class="muted">${esc(h.city || "")} · ${esc(h.country || "")}</div>
            <div class="row" style="gap:6px;margin-top:6px">
              <button type="button" class="btn ghost sm" data-open-detail="${esc(
                String(h.id)
              )}">打开详情</button>
              <button type="button" class="btn ghost sm" data-unfav="${esc(
                String(h.id)
              )}">取消</button>
            </div>
          </div>`
        )
        .join("");
      card.innerHTML = `<h3>本机收藏</h3>
        <p class="muted">演示收藏，仅存本机。</p>
        <div class="list">${rows || "<p class='muted'>收藏的医院暂不可用</p>"}</div>`;
      $$("#medFavListCard [data-open-detail]").forEach((btn) => {
        btn.onclick = () => openMedDetail(btn.dataset.openDetail);
      });
      $$("#medFavListCard [data-unfav]").forEach((btn) => {
        btn.onclick = () => {
          toggleFav(btn.dataset.unfav);
          toast("已取消收藏");
          paintMedFavList().catch(() => {});
          if (typeof refreshMed === "function") {
            refreshMed(
              ($("#medQ") && $("#medQ").value.trim()) || "",
              ($("#medCountry") && $("#medCountry").value) || ""
            );
          }
        };
      });
    } catch (_) {
      card.innerHTML = `<h3>本机收藏</h3><p class="muted">列表暂不可用</p>`;
    }
  }

  function enhanceMedDetailButtons() {
    $$("#medList .item").forEach((el) => {
      if (el.querySelector("[data-open-detail]")) return;
      const hidBtn = el.querySelector("[data-hid]");
      const hid = (hidBtn && hidBtn.dataset.hid) || el.dataset.hid;
      if (!hid) return;
      const row = el.querySelector(".row") || el;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.dataset.openDetail = hid;
      btn.textContent = "查看详情";
      btn.onclick = () => openMedDetail(hid);
      if (row.classList && row.classList.contains("row")) row.appendChild(btn);
      else {
        const wrap = document.createElement("div");
        wrap.className = "row";
        wrap.style.cssText = "gap:6px;flex-wrap:wrap;margin-top:8px";
        wrap.appendChild(btn);
        el.appendChild(wrap);
      }
    });
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "", region) {
    await _refreshMed(q, country, region);
    enhanceMedDetailButtons();
    await paintMedFavList();
  };

  /* 10 · 设置·服务版本与自启说明 */
  async function enhanceSettingsServiceCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsServiceCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsServiceCard";
      card.className = "card settings-service-card";
      const env = $("#settingsEnvCard");
      if (env && env.parentNode) env.insertAdjacentElement("afterend", card);
      else box.insertBefore(card, box.firstChild);
    }
    try {
      const h = await api("/api/health");
      card.innerHTML = `<h3>服务版本与托管</h3>
        <p class="muted">只读说明，便于确认线上是否由服务托管。</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">App</span><b style="font-size:14px">${esc(
            h.version || "—"
          )}</b></div>
          <div class="box"><span class="muted">服务</span><b style="font-size:14px">${esc(
            h.server_version || "—"
          )}</b></div>
        </div>
        <p class="muted settings-systemd-note" style="margin-top:10px">线上由 systemd einherit 托管</p>
        <p class="muted" style="margin-top:6px">${esc(h.app || "电子继承")} · ${esc(
        h.domain || "einherit.cn"
      )}</p>`;
    } catch (e) {
      card.innerHTML = `<h3>服务版本与托管</h3>
        <p class="muted">服务暂不可用：${esc(e.message)}</p>
        <p class="muted settings-systemd-note">线上由 systemd einherit 托管</p>`;
    }
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeHealthBadge().catch(() => {}), 0);
    if (id === "legacy") setTimeout(paintLegacyEmptyGuide, 40);
    if (id === "assets") setTimeout(enhanceAssetsToLegacy, 40);
    if (id === "checkin") setTimeout(() => paintBackupMissingCta().catch(() => {}), 40);
    if (id === "aftercare") {
      setTimeout(() => {
        patchAftercareBudgetConfirm();
        paintAuthGateReason().catch(() => {});
      }, 40);
    }
    if (id === "handover") setTimeout(() => paintHandoverExecutorTip().catch(() => {}), 40);
    if (id === "med") {
      setTimeout(() => {
        enhanceMedDetailButtons();
        paintMedFavList().catch(() => {});
      }, 40);
    }
    if (id === "settings") setTimeout(() => enhanceSettingsServiceCard().catch(() => {}), 0);
    if (id === "medDetail") {
      /* detail opened via openMedDetail */
    }
  };

  // Boot
  if ($("#home") && $("#home").classList.contains("active")) {
    paintHomeHealthBadge().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    patchAftercareBudgetConfirm();
    paintAuthGateReason().catch(() => {});
  }
})();
