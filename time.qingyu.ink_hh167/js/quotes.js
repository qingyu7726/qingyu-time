/**
 * Motivational Quotes — 一言 API + 本地后备
 *
 * - 后台预热大量语录缓存，random() 从缓存同步取出，无延迟
 * - 缓存耗尽时自动从 API 补充，API 故障时使用本地经典语录
 * - 类型过滤：文学(d)、诗词(i)、哲学(k)、原创(e)
 */
const Quotes = (() => {
    // ── 本地经典语录后备 ──
    const fallback = [
        '志不强者智不达。— 墨子',
        '天行健，君子以自强不息。— 《周易》',
        '千里之行，始于足下。— 老子',
        '业精于勤，荒于嬉。— 韩愈',
        '学而不思则罔，思而不学则殆。— 孔子',
        '宝剑锋从磨砺出，梅花香自苦寒来。',
        '不积跬步，无以至千里。— 荀子',
        '盛年不重来，一日难再晨。及时当勉励，岁月不待人。— 陶渊明',
        '莫等闲，白了少年头，空悲切。— 岳飞',
        '一寸光阴一寸金，寸金难买寸光阴。',
        '少壮不努力，老大徒伤悲。— 《长歌行》',
        '读书破万卷，下笔如有神。— 杜甫',
        '路漫漫其修远兮，吾将上下而求索。— 屈原',
        '非淡泊无以明志，非宁静无以致远。— 诸葛亮',
        '锲而不舍，金石可镂。— 荀子',
        '世上无难事，只要肯登攀。— 毛泽东',
        '为中华之崛起而读书。— 周恩来',
        '合理安排时间，就等于节约时间。— 培根',
        '放弃时间的人，时间也放弃他。— 莎士比亚',
        '星光不问赶路人，时光不负有心人。',
        '自律即自由。',
        '每一次努力，都是未来的伏笔。',
        '没有比脚更长的路，没有比人更高的山。— 汪国真',
        '成功不必在我，而功力必不唐捐。— 胡适',
        '世界以痛吻我，要我报之以歌。— 泰戈尔',
        '生活就像海洋，只有意志坚强的人，才能到达彼岸。— 马克思',
        '今天所做之事勿候明天，自己所做之事勿候他人。— 歌德',
        '知人者智，自知者明。— 老子',
        '己所不欲，勿施于人。— 孔子',
        '三人行，必有我师焉。— 孔子',
        '温故而知新，可以为师矣。— 孔子',
        '学而时习之，不亦说乎。— 孔子',
        '知之者不如好之者，好之者不如乐之者。— 孔子',
        '博学之，审问之，慎思之，明辨之，笃行之。— 《中庸》',
        '勿以恶小而为之，勿以善小而不为。— 刘备',
        '静以修身，俭以养德。— 诸葛亮',
        '海纳百川，有容乃大。— 林则徐',
        '天下兴亡，匹夫有责。— 顾炎武',
        '苟利国家生死以，岂因祸福避趋之。— 林则徐',
        '物来顺应，未来不迎，当时不杂，既过不恋。— 曾国藩',
        '但行好事，莫问前程。',
        '念念不忘，必有回响。',
        '凡是过往，皆为序章。— 莎士比亚',
        '万物皆有裂痕，那是光照进来的地方。— 莱昂纳德·科恩',
        '愿你出走半生，归来仍是少年。',
        '世界上只有一种真正的英雄主义，就是认清了生活的真相后还依然热爱它。— 罗曼·罗兰',
        '当你为错过太阳而哭泣的时候，你也要再错过群星了。— 泰戈尔',
        '即使慢，驰而不息，纵令落后，纵令失败，但一定可以达到他所向的目标。— 鲁迅',
        '命运掌握在自己手中。要么你驾驭生命，要么生命驾驭你，你的心态决定你是坐骑还是骑手。',
        '你若爱，生活哪里都可爱。— 丰子恺',
        '人生若只如初见，何事秋风悲画扇。— 纳兰性德',
        '长风破浪会有时，直挂云帆济沧海。— 李白',
        '会当凌绝顶，一览众山小。— 杜甫',
        '山重水复疑无路，柳暗花明又一村。— 陆游',
    ];

    // ── 缓存池 ──
    let _pool = [];           // 已缓存的语录
    let _fetching = false;    // 是否正在请求 API
    const MIN_POOL = 20;      // 缓存低于此数触发补充
    const BATCH_SIZE = 15;    // 每次请求的条数

    // ── 格式化一言 API 返回 ──
    function formatQuote(data) {
        const text = data.hitokoto || '';
        let suffix = '';
        if (data.from_who) suffix = '— ' + data.from_who;
        else if (data.from) suffix = '— 《' + data.from + '》';
        return suffix ? text + ' ' + suffix : text;
    }

    // ── 从 API 拉取一条语录 ──
    async function fetchOne() {
        try {
            // 文学(d) + 诗词(i) + 哲学(k) + 原创(e)，只返回纯文本
            const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k&c=e&max_length=60', {
                signal: AbortSignal.timeout(5000)
            });
            if (!res.ok) return null;
            const data = await res.json();
            return formatQuote(data);
        } catch {
            return null;
        }
    }

    // ── 补充缓存池 ──
    async function refillPool() {
        if (_fetching) return;
        _fetching = true;

        const need = Math.max(BATCH_SIZE, MIN_POOL - _pool.length);

        // 控制并发，避免触发频率限制
        const promises = [];
        for (let i = 0; i < need; i++) {
            promises.push(fetchOne());
            // 串行间隔 200ms 防止打爆接口
            if (i < need - 1) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        const results = await Promise.all(promises);
        let added = 0;
        for (const q of results) {
            if (q && !_pool.includes(q)) {
                _pool.push(q);
                added++;
            }
        }

        // 如果 API 返回不足，混入本地后备
        if (_pool.length < MIN_POOL) {
            const shuffled = [...fallback].sort(() => Math.random() - 0.5);
            for (const q of shuffled) {
                if (!_pool.includes(q)) {
                    _pool.push(q);
                    if (_pool.length >= MIN_POOL + 20) break;
                }
            }
        }

        _fetching = false;
    }

    // ── 初始化预热 ──
    function initPool() {
        // 先用本地后备填满基础池
        const shuffled = [...fallback].sort(() => Math.random() - 0.5);
        _pool = [...shuffled];
        // 后台拉 API
        refillPool();
    }

    // ── 公开 API ──
    function random() {
        if (_pool.length === 0) {
            // 极端情况：从后备直接取
            return fallback[Math.floor(Math.random() * fallback.length)];
        }

        // 随机取一条，取出即移除（避免连续重复）
        const idx = Math.floor(Math.random() * _pool.length);
        const quote = _pool[idx];
        _pool.splice(idx, 1);

        // 检查是否需要补充
        if (_pool.length < MIN_POOL && !_fetching) {
            refillPool();
        }

        return quote;
    }

    function getAll() {
        return [..._pool, ...fallback];
    }

    // 页面加载后初始化
    if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPool);
        } else {
            initPool();
        }
    }

    return { random, getAll };
})();
