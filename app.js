/**
 * 家族旅行eSIMレスキュー - メインアプリケーション
 * 診断ロジック・タブ制御・FAQ・イベントトラッキング
 */

(function () {
  'use strict';

  // ========================================
  // 設定読み込み
  // ========================================
  let config = null;

  async function loadConfig() {
    try {
      const response = await fetch('config.json');
      config = await response.json();
      console.log('[Config] 読み込み完了', config);
      updateFooter();
      return config;
    } catch (error) {
      console.error('[Config] 読み込みエラー:', error);
      return null;
    }
  }

  function updateFooter() {
    if (!config) return;

    const lastUpdatedEl = document.getElementById('lastUpdated');
    const authorEl = document.getElementById('authorName');

    if (lastUpdatedEl && config.site.last_updated) {
      lastUpdatedEl.textContent = config.site.last_updated;
    }
    if (authorEl && config.site.author) {
      authorEl.textContent = config.site.author;
    }
  }

  // ========================================
  // イベントトラッキング（GA4等への差し替え想定）
  // ========================================
  function trackEvent(eventName, params = {}) {
    console.log('[Event]', eventName, params);

    // GA4への送信例（コメントアウト）
    // if (typeof gtag === 'function') {
    //   gtag('event', eventName, params);
    // }
  }

  // ========================================
  // 診断ロジック
  // ========================================
  const diagnosisState = {
    currentStep: 1,
    answers: {
      destination: null,
      device: null,
      family: null
    }
  };

  // 診断結果のマッピング
  const diagnosisResults = {
    // 渡航先×端末×家族運用の組み合わせで結果を決定
    getResult: function (answers) {
      const { destination, device, family } = answers;

      // 基本の手順リスト
      const baseSteps = [
        '機内モードON→OFF（全接続リセット）',
        '「モバイルデータ通信」がONか確認',
        '「データローミング」をプラン案内に従って設定（多くはON必要）※日本SIMは必ずOFF',
        'eSIMの回線が選択されているか確認',
        '端末を再起動する'
      ];

      // 端末別の追加手順
      if (device === 'iphone') {
        baseSteps.push('「設定」→「モバイル通信」→該当eSIMをタップ→「この回線をオンにする」を確認');
      } else {
        baseSteps.push('「設定」→「ネットワークとインターネット」→「SIM」→該当eSIMを選択→有効化を確認');
      }

      // 推奨eSIMの決定ロジック
      let recommendations = [];
      let cautions = [];

      // 渡航先別の推奨
      if (destination === 'korea') {
        recommendations = [
          {
            name: 'Airalo',
            key: 'airalo',
            isPrimary: true,
            reason: '韓国向けプランが充実。即時発行で現地到着後すぐ使える。',
            features: ['日本語アプリ対応', '1GB/7日〜選べる', '24時間チャットサポート', 'QRコード即時発行']
          },
          {
            name: 'Ubigi',
            key: 'ubigi',
            isPrimary: false,
            reason: '大手通信会社提携で安定性重視。長期滞在にも対応。',
            features: ['通信品質が安定', 'データ追加が簡単', 'ヨーロッパでも使える', 'ビジネス利用にも']
          }
        ];
        cautions.push('韓国ではVPN規制があるため、必要な場合は事前設定を');
      } else if (destination === 'taiwan') {
        recommendations = [
          {
            name: 'Holafly',
            key: 'holafly',
            isPrimary: true,
            reason: '台湾向け無制限プランあり。家族でデータシェアに最適。',
            features: ['データ無制限プラン', 'テザリング対応', '日本語サポート', '返金保証あり']
          },
          {
            name: 'Nomad',
            key: 'nomad',
            isPrimary: false,
            reason: 'コスパ重視。短期旅行なら十分な容量。',
            features: ['価格が安い', 'シンプルな料金体系', 'アジア周遊プランあり', 'アプリで簡単管理']
          }
        ];
        cautions.push('台湾は通信品質が良好。どのeSIMでも快適に使えます');
      } else if (destination === 'southeast-asia') {
        recommendations = [
          {
            name: 'Holafly',
            key: 'holafly',
            isPrimary: true,
            reason: '東南アジア周遊に最適な無制限プラン。複数国でも1枚でOK。',
            features: ['アジア周遊プラン', 'データ無制限', 'テザリング可能', '24時間日本語サポート']
          },
          {
            name: 'Airalo',
            key: 'airalo',
            isPrimary: false,
            reason: '国別プランで必要な分だけ購入。コスト管理しやすい。',
            features: ['国別プラン豊富', '必要な分だけ購入', 'データ追加可能', 'アプリ管理が簡単']
          }
        ];
        cautions.push('国によって通信品質に差があります。都市部では問題なし');
      } else {
        // その他の地域
        recommendations = [
          {
            name: 'Ubigi',
            key: 'ubigi',
            isPrimary: true,
            reason: '200以上の国・地域対応。どこでも安心して使える。',
            features: ['グローバル対応', '大手通信会社提携', '安定した通信品質', 'ビジネス利用可']
          },
          {
            name: 'GigSky',
            key: 'gigsky',
            isPrimary: false,
            reason: 'Apple公式パートナー。iPhone設定画面から直接購入可能。',
            features: ['Apple公式連携', '設定が簡単', '世界190カ国対応', 'プレミアムサポート']
          }
        ];
        cautions.push('渡航先の対応状況を事前に確認してください');
      }

      // 家族運用別の追加アドバイス
      if (family === 'tethering') {
        cautions.push('テザリング利用の場合、無制限プランがおすすめです');
        cautions.push('親機のバッテリー消耗が早くなります。モバイルバッテリー必須');
      } else if (family === 'each') {
        cautions.push('各自eSIMの場合、同じサービスで揃えると管理が楽です');
        cautions.push('子供用端末のeSIM対応可否を事前確認してください');
      }

      // 端末別の注意
      if (device === 'android') {
        cautions.push('Android端末はメーカー・機種によって設定画面が異なります');
      }

      return {
        steps: baseSteps,
        recommendations: recommendations,
        cautions: cautions,
        summary: `${getDestinationName(destination)}への${getDeviceName(device)}ユーザー向け`
      };
    }
  };

  function getDestinationName(key) {
    const names = {
      'korea': '韓国',
      'taiwan': '台湾',
      'southeast-asia': '東南アジア',
      'other': 'その他の地域'
    };
    return names[key] || key;
  }

  function getDeviceName(key) {
    const names = {
      'iphone': 'iPhone',
      'android': 'Android'
    };
    return names[key] || key;
  }

  function getFamilyName(key) {
    const names = {
      'tethering': '1台テザリング',
      'each': '各自eSIM',
      'undecided': '未定'
    };
    return names[key] || key;
  }

  // 診断UI初期化
  function initDiagnosis() {
    const diagnosis = document.getElementById('diagnosis');
    if (!diagnosis) return;

    const options = diagnosis.querySelectorAll('.diagnosis__option');
    options.forEach(option => {
      option.addEventListener('click', handleOptionClick);
    });
  }

  function handleOptionClick(e) {
    const option = e.currentTarget;
    const question = option.closest('.diagnosis__question');
    const step = parseInt(question.dataset.step);
    const value = option.dataset.value;
    const type = question.dataset.type;

    // 選択状態を更新
    question.querySelectorAll('.diagnosis__option').forEach(opt => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');

    // 回答を保存
    diagnosisState.answers[type] = value;

    // イベント送信
    trackEvent('diagnosis_answer', {
      step: step,
      type: type,
      value: value
    });

    // 次のステップへ
    setTimeout(() => {
      if (step < 3) {
        goToStep(step + 1);
      } else {
        showResult();
      }
    }, 300);
  }

  function goToStep(step) {
    diagnosisState.currentStep = step;

    // プログレスバー更新
    const progressSteps = document.querySelectorAll('.diagnosis__step');
    progressSteps.forEach((el, index) => {
      el.classList.remove('active', 'completed');
      if (index < step - 1) {
        el.classList.add('completed');
      } else if (index === step - 1) {
        el.classList.add('active');
      }
    });

    // 質問表示切替
    const questions = document.querySelectorAll('.diagnosis__question');
    questions.forEach(q => {
      q.classList.remove('active');
      if (parseInt(q.dataset.step) === step) {
        q.classList.add('active');
      }
    });

    // 結果を非表示
    const result = document.querySelector('.diagnosis__result');
    if (result) {
      result.classList.remove('active');
    }
  }

  function showResult() {
    const result = diagnosisResults.getResult(diagnosisState.answers);

    // プログレスバーを全完了に
    document.querySelectorAll('.diagnosis__step').forEach(el => {
      el.classList.remove('active');
      el.classList.add('completed');
    });

    // 質問を非表示
    document.querySelectorAll('.diagnosis__question').forEach(q => {
      q.classList.remove('active');
    });

    // 結果を構築して表示
    const resultEl = document.querySelector('.diagnosis__result');
    if (resultEl) {
      renderResult(resultEl, result);
      resultEl.classList.add('active');
    }

    // イベント送信
    trackEvent('diagnosis_complete', {
      destination: diagnosisState.answers.destination,
      device: diagnosisState.answers.device,
      family: diagnosisState.answers.family,
      primary_recommendation: result.recommendations[0]?.key
    });
  }

  function renderResult(container, result) {
    const { steps, recommendations, cautions, summary } = result;

    // サマリー更新
    const summaryEl = container.querySelector('.result__summary');
    if (summaryEl) {
      summaryEl.textContent = summary;
    }

    // 手順リスト更新
    const stepsEl = container.querySelector('.result__steps');
    if (stepsEl) {
      stepsEl.innerHTML = steps.map((step, index) => `
        <li>
          <span class="result__step-num">${index + 1}</span>
          <span>${step}</span>
        </li>
      `).join('');
    }

    // 推奨eSIM更新
    const recsEl = container.querySelector('.result__recommendations');
    if (recsEl) {
      recsEl.innerHTML = recommendations.map((rec, index) => {
        const isPrimary = index === 0;

        return `
          <div class="recommendation-card ${isPrimary ? 'primary' : ''}">
            ${isPrimary ? '<span class="recommendation-card__badge">おすすめ</span>' : '<span class="recommendation-card__badge" style="background: #666;">代替案</span>'}
            <h4 class="recommendation-card__name">${rec.name}</h4>
            <p class="recommendation-card__reason">${rec.reason}</p>
            <ul class="recommendation-card__features">
              ${rec.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <div class="recommendation-card__coupon" 
                 style="background: #e0e0e0; color: #666; cursor: pointer; pointer-events: auto;"
                 data-cta-blocked="1"
                 data-provider="${rec.key}"
                 data-location="diagnosis_result">
              🔜 提携準備中
            </div>
            <button type="button" 
               class="btn btn--${isPrimary ? 'primary' : 'outline'}" 
               style="cursor: pointer; pointer-events: auto !important;"
               data-cta-blocked="1"
               data-provider="${rec.key}"
               data-location="diagnosis_result">
              提携準備中（近日公開）
            </button>
          </div>
        `;
      }).join('');
    }

    // 注意点更新
    const cautionsEl = container.querySelector('.result__caution');
    if (cautionsEl) {
      cautionsEl.innerHTML = `
        <p class="result__caution-title">⚠️ 注意点</p>
        <ul>
          ${cautions.map(c => `<li>${c}</li>`).join('')}
        </ul>
      `;
    }
  }

  function resetDiagnosis() {
    diagnosisState.currentStep = 1;
    diagnosisState.answers = {
      destination: null,
      device: null,
      family: null
    };

    // 選択状態をリセット
    document.querySelectorAll('.diagnosis__option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // 最初のステップへ
    goToStep(1);

    trackEvent('diagnosis_restart');
  }

  // グローバルに公開（HTML内のonclickから呼び出す用）
  window.resetDiagnosis = resetDiagnosis;
  window.trackCTAClick = function (provider, location) {
    trackEvent('cta_click', {
      provider: provider,
      location: location
    });
  };

  // 診断結果などの動的要素・静的要素を問わずクリックを拾う（Event Delegation）
  function initBlockedCTA() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest?.('[data-cta-blocked="1"]');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();
      const provider = btn.getAttribute('data-provider') || 'unknown';
      const location = btn.getAttribute('data-location') || 'unknown';

      trackEvent('cta_click_blocked', {
        provider: provider,
        location: location,
        reason: 'coming_soon'
      });

      alert('現在、提携準備中のため申込リンクは近日公開です。診断はそのままご利用いただけます。');
    }, true);
  }

  // ========================================
  // タブ制御
  // ========================================
  function initTabs() {
    const tabContainers = document.querySelectorAll('.tabs');

    tabContainers.forEach(container => {
      const buttons = container.querySelectorAll('.tabs__btn');
      const panels = container.querySelectorAll('.tabs__panel');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;

          // ボタンの状態更新
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // パネルの表示切替
          panels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === target) {
              panel.classList.add('active');
            }
          });

          trackEvent('tab_change', { tab: target });
        });
      });
    });
  }

  // ========================================
  // FAQ アコーディオン
  // ========================================
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq__item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq__question');

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // 他を閉じる（オプション）
        // faqItems.forEach(i => i.classList.remove('open'));

        // トグル
        item.classList.toggle('open');

        trackEvent('faq_toggle', {
          question: question.textContent.trim().substring(0, 50),
          action: isOpen ? 'close' : 'open'
        });
      });
    });
  }

  // ========================================
  // スムーズスクロール
  // ========================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          trackEvent('smooth_scroll', { target: href });
        }
      });
    });
  }

  // ========================================
  // CTAボタンのトラッキング
  // ========================================
  function initCTATracking() {
    document.querySelectorAll('.btn').forEach(btn => {
      if (btn.hasAttribute('data-tracked')) return;

      btn.setAttribute('data-tracked', 'true');
      btn.addEventListener('click', function () {
        const text = this.textContent.trim();
        const href = this.getAttribute('href') || '';

        trackEvent('button_click', {
          text: text.substring(0, 30),
          href: href.substring(0, 100),
          location: this.closest('section')?.id || 'unknown'
        });
      });
    });
  }

  // ========================================
  // おすすめeSIM一覧のリンク無効化（提携準備中）
  // ========================================
  function initComparisonLinks() {
    // 比較セクションのCTAボタンを無効化
    document.querySelectorAll('.target-card[data-provider] a.btn').forEach(link => {
      const provider = link.closest('[data-provider]').dataset.provider;

      // リンクを無効化（javascript:void(0)にする）
      link.href = 'javascript:void(0)';
      link.style.opacity = '1';
      link.style.cursor = 'pointer';
      link.style.pointerEvents = 'auto';
      link.textContent = '提携準備中（近日公開）';

      // 属性を付与して Event Delegation で捕捉させる
      link.setAttribute('data-cta-blocked', '1');
      link.setAttribute('data-provider', provider);
      link.setAttribute('data-location', 'comparison');

      // 既存のonclickがあれば削除
      link.removeAttribute('onclick');
    });
  }

  // ========================================
  // 初期化
  // ========================================
  async function init() {
    await loadConfig();
    initDiagnosis();
    initTabs();
    initFAQ();
    initSmoothScroll();
    initCTATracking();
    initComparisonLinks();
    initBlockedCTA();

    console.log('[App] 初期化完了');
    trackEvent('page_load');
  }

  // DOMContentLoaded で実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
