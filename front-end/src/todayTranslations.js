const rows = `THE DAILY EDIT|DEIN TAGESJOURNAL|今日特辑
A good day to|Ein guter Tag, um|今天，适合
get curious.|neugierig zu sein.|保持好奇。
A little direction. A little discovery. All yours.|Etwas Orientierung. Eine neue Entdeckung. Dein Tag.|一点方向，一点发现，属于你的一天。
Learning coins|Lernmünzen|学习金币
Make a plan|Planen|制定计划
Reconnect|Wiederholen|温故知新
Get curious|Entdecken|探索新知
Choose your direction|Wähle deine Richtung|选择你的方向
A LITTLE DIRECTION|EIN WENIG ORIENTIERUNG|找到方向
Big things start with one small step.|Großes beginnt mit einem kleinen Schritt.|从一小步开始，走向大目标。
A clear day. An open possibility.|Ein freier Tag. Neue Möglichkeiten.|日程空闲，可能无限。
Start with the next thing on your radar. The rest can wait a moment.|Beginne mit deiner nächsten Aufgabe. Der Rest kann kurz warten.|先处理眼前的一件事，其他的可以稍等。
Choose a subject, follow an idea, and see where it takes you.|Wähle ein Fach, folge einer Idee und schau, wohin sie führt.|选择一个学科，跟随一个想法，看看会发现什么。
Open this task|Aufgabe öffnen|查看这项任务
Explore your subjects|Fächer entdecken|探索你的学科
CONNECT THE DOTS|ZUSAMMENHÄNGE ENTDECKEN|串联知识
Some ideas deserve a second hello.|Manche Ideen verdienen ein Wiedersehen.|有些知识，值得再次相遇。
Your review queue is ready. Revisit an idea and make it stick.|Deine Wiederholungen warten. Frische eine Idee auf und festige sie.|复习题已准备好，重温知识，让记忆更牢固。
A little retrieval goes a long way. See what you remember from your subjects.|Aktives Erinnern hilft. Finde heraus, was du noch weißt.|试着主动回忆，看看你还记得多少。
Open review queue|Wiederholungen öffnen|打开复习队列
Try a quick review|Kurz wiederholen|来一次快速复习
Ready to revisit|Bereit zum Wiederholen|等待重温
questions in your queue|Fragen zum Wiederholen|道题等待复习
TAKE THE SCENIC ROUTE|GEH AUF ENTDECKUNGSREISE|走一条探索之路
Your next favourite idea is out there.|Deine nächste Lieblingsidee wartet schon.|下一个让你着迷的想法，正在等你。
Step outside the syllabus for a moment. Find a story, a new perspective, or a question worth chasing.|Lass den Lehrplan kurz hinter dir. Entdecke eine Geschichte, eine neue Perspektive oder eine spannende Frage.|暂时走出课本，寻找一个故事、一种新视角，或一个值得追问的问题。
Find your next read|Finde dein nächstes Buch|寻找下一本好书
A DIFFERENT KIND OF ADVENTURE|EIN ANDERES ABENTEUER|另一种冒险
One page can change your perspective.|Eine Seite kann deinen Blick verändern.|一页文字，也能改变你的视角。
A WORLD OF POSSIBILITIES|EINE WELT VOLLER MÖGLICHKEITEN|充满可能的世界
Visit your buddy|Besuche deinen Buddy|看看你的伙伴
Stay curious.|Bleib neugierig.|保持好奇。
Your pace. Your next chapter.|Dein Tempo. Dein nächstes Kapitel.|你的节奏，你的新篇章。
THE DAILY SPARK|DER TAGESIMPULS|每日灵感
One question. A new connection.|Eine Frage. Ein neuer Zusammenhang.|一个问题，一点新发现。
Follow your curiosity.|Folge deiner Neugier.|跟随你的好奇心。
Choose an answer|Wähle eine Antwort|选择一个答案
That’s the connection.|Genau das ist der Zusammenhang.|你找到了其中的联系。
A useful discovery.|Eine hilfreiche Entdeckung.|又有了新的收获。
Keep exploring|Weiter entdecken|继续探索
Just a warm-up. No score, no pressure.|Zum Aufwärmen. Ohne Punkte, ohne Druck.|轻松热身，不计分，没有压力。
Your day at a glance|Dein Tag im Überblick|你的一日概览
YOUR DAY, AT A GLANCE|DEIN TAG IM ÜBERBLICK|你的一日概览
open tasks|offene Aufgaben|项待办任务
ready to revisit|zum Wiederholen|道待复习题
BEYOND YOUR DESK|ABSEITS DES SCHREIBTISCHS|书桌之外
The school edit.|Dein Schuljournal.|校园特辑。
Your private school feed|Deine privaten Schulnachrichten|你的私人学校动态
On your radar|Das steht an|你的待办雷达
FOLLOW A DIFFERENT THREAD|FOLGE EINER NEUEN SPUR|沿着另一条线索
There’s more out there.|Da draußen wartet noch mehr.|还有更多，等你发现。
Choose your own adventure.|Wähle dein eigenes Abenteuer.|选择属于你的探索。
Make it click.|Bis es Klick macht.|让知识融会贯通。
See the bigger picture.|Sieh das große Ganze.|看见更广阔的世界。
Meet your next challenge.|Stell dich deiner nächsten Aufgabe.|迎接下一个挑战。
A little curiosity looks good on you.|Neugier steht dir gut.|好奇心，让你与众不同。`;

export const todayTranslations = { de: {}, zh: {} };
for (const row of rows.split('\n')) {
  const [en, de, zh] = row.split('|');
  todayTranslations.de[en] = de;
  todayTranslations.zh[en] = zh;
}
