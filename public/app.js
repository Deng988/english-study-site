const sampleSubtitle = `1
00:00:00,000 --> 00:00:03,000
One of the most powerful ways to improve your English

2
00:00:03,000 --> 00:00:06,000
is to learn from content that you genuinely enjoy.

3
00:00:06,000 --> 00:00:09,500
When you are emotionally engaged, you remember vocabulary more easily.

4
00:00:09,500 --> 00:00:13,000
You also begin to notice how grammar works in authentic situations.

5
00:00:13,000 --> 00:00:16,500
That is why short videos, podcasts, and interviews can be so effective.`;

const sampleBilingual = `Hi everyone.
大家好。

Thank you so much for the introduction.
非常感谢您的介绍。

It is great to be here.
很高兴来到这里。

We want to discuss how we scale our model in different dimensions.
我们想讨论如何在不同维度上扩展我们的模型。`;

const subtitleInput = document.getElementById("subtitleInput");
const bilingualInput = document.getElementById("bilingualInput");
const cleanedText = document.getElementById("cleanedText");
const vocabularyList = document.getElementById("vocabularyList");
const wordCountLabel = document.getElementById("wordCountLabel");
const modeBadge = document.getElementById("modeBadge");
const analyzeButton = document.getElementById("analyzeButton");
const analyzeRawButton = document.getElementById("analyzeRawButton");
const analyzeBilingualButton = document.getElementById("analyzeBilingualButton");
const clearButton = document.getElementById("clearButton");
const sampleButton = document.getElementById("sampleButton");
const importTextButton = document.getElementById("importTextButton");
const textFileInput = document.getElementById("textFileInput");
const toggleInputButton = document.getElementById("toggleInputButton");
const inputPanelBody = document.getElementById("inputPanelBody");
const downloadTextButton = document.getElementById("downloadTextButton");
const openArticleButton = document.getElementById("openArticleButton");
const toggleHighlightButton = document.getElementById("toggleHighlightButton");
const perSentenceButton = document.getElementById("perSentenceButton");
const topHundredButton = document.getElementById("topHundredButton");
const exportWordsButton = document.getElementById("exportWordsButton");

let inputCollapsed = false;
let highlightEnabled = true;
let currentWordMode = "perSentence";
let currentCleanedText = "";
let currentSentenceLines = [];
let currentBilingualPairs = [];
let currentDisplayLines = [];
let perSentenceWords = [];
let longestWords = [];

function escapeHtml(text){return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function renderMessage(target,message){target.innerHTML="";target.classList.add("muted");target.textContent=message;}
function downloadFile(filename,content,mimeType){const blob=new Blob([content],{type:mimeType});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);}
function tokenize(text){return text.match(/[A-Za-z][A-Za-z'-]*/g)||[];}
function splitSentences(text){return text.split(/(?<=[.!?])\s+/).map((s)=>s.trim()).filter(Boolean);}
function isEnglishLike(line){return /[A-Za-z]/.test(line);}
function normalizeWord(word){return word.toLowerCase().replace(/^'+|'+$/g,"");}

function simpleMeaningForWord(word){
  const dictionary={architecture:"架构",architectures:"架构",optimizer:"优化器",optimizers:"优化器",dimensions:"维度",scaling:"扩展",introduction:"介绍",emotionally:"情绪上地",vocabulary:"词汇",authentic:"真实的",situations:"情境",effective:"有效的",genuinely:"真正地",civilization:"文明",influential:"有影响力的",attributed:"归因于",democratizing:"普及化",proportionally:"按比例地",psychologically:"心理上地",opportunity:"机会",community:"社区",intelligence:"智能",different:"不同的",discussion:"讨论",accessible:"可访问的",proprietary:"专有的"};
  const lower=word.toLowerCase();
  if(dictionary[lower]) return dictionary[lower];
  if(lower.endsWith("tion")||lower.endsWith("sion")) return "某种过程/结果";
  if(lower.endsWith("ment")) return "某种结果/状态";
  if(lower.endsWith("ness")) return "某种性质/状态";
  if(lower.endsWith("ity")) return "某种特性";
  if(lower.endsWith("ing")) return "正在... / ...过程";
  if(lower.endsWith("ed")) return "...了 / 被...的";
  if(lower.endsWith("ly")) return "...地";
  if(lower.endsWith("ous")) return "...的";
  if(lower.endsWith("ive")) return "...性的";
  if(lower.endsWith("able")) return "可以...的";
  return "较复杂词";
}

function isStudyWord(word){
  const lower=normalizeWord(word);
  const stopwords=new Set(["about","after","again","almost","always","anybody","anyone","anything","because","before","better","could","different","everyone","everything","example","forward","great","hello","history","important","latest","local","maybe","models","nothing","open","people","really","servers","should","single","something","thank","there","these","thing","those","through","today","trying","using","video","where","world","would","guys","share","progress"]);
  if(stopwords.has(lower)) return false;
  if(lower.length<8) return false;
  if(/^(uh|yeah|okay|gonna|wanna|kinda|sorta)$/i.test(lower)) return false;
  return true;
}

function parseBilingualInput(text){
  const lines=text.replace(/\r/g,"").split("\n").map((line)=>line.trim()).filter(Boolean);
  const pairs=[]; let currentEnglish=""; let currentChinese=[];
  for(const line of lines){
    if(isEnglishLike(line)){
      if(currentEnglish) pairs.push({en:currentEnglish,zh:currentChinese.join(" ")});
      currentEnglish=line; currentChinese=[];
    } else if(currentEnglish){ currentChinese.push(line); }
  }
  if(currentEnglish) pairs.push({en:currentEnglish,zh:currentChinese.join(" ")});
  return pairs;
}

function getBilingualDisplayLines(text){
  return text
    .replace(/\r/g,"")
    .split("\n")
    .map((line)=>line.replace(/\s+$/g,""))
    .filter((line)=>line.trim().length>0);
}

function getEnglishLinesFromBilingualDisplay(lines){
  return lines.filter((line)=>isEnglishLike(line));
}

function buildTopLongestWords(sentenceLines){
  const counts=new Map(); const sampleSentence=new Map();
  for(const sentence of sentenceLines){
    for(const rawWord of tokenize(sentence)){
      const word=normalizeWord(rawWord);
      if(!isStudyWord(word)) continue;
      counts.set(word,(counts.get(word)||0)+1);
      if(!sampleSentence.has(word)) sampleSentence.set(word,sentence);
    }
  }
  return [...counts.entries()].map(([word,count])=>({word,level:word.length>=11?"C1":"B2",meaning:simpleMeaningForWord(word),sentence:sampleSentence.get(word)||"",count}))
    .sort((a,b)=>b.word.length-a.word.length||b.count-a.count||a.word.localeCompare(b.word)).slice(0,100);
}

function getDisplayedWords(){return currentWordMode==="topHundred"?longestWords:perSentenceWords;}

function renderVocabulary(items){
  vocabularyList.classList.remove("muted");
  vocabularyList.innerHTML="";
  if(!items||items.length===0){
    vocabularyList.classList.add("muted");
    vocabularyList.textContent="没有识别到适合当前规则的长单词。";
    wordCountLabel.textContent="没有可显示的复杂词。";
    return;
  }
  wordCountLabel.textContent=currentWordMode==="topHundred"?`当前显示最长 ${items.length} 个去重长词`:`当前显示 ${items.length} 个每句候选词`;
  for(const item of items){
    const card=document.createElement("div");
    card.className="item-card";
    const countLine=item.count?`<p><strong>出现次数：</strong>${item.count}</p>`:"";
    card.innerHTML=`<strong>${escapeHtml(item.word)}<span class="tag">${item.level}</span></strong><p><strong>翻译：</strong>${escapeHtml(item.meaning||"")}</p>${countLine}<p><strong>例句：</strong>${escapeHtml(item.sentence||"")}</p>`;
    vocabularyList.appendChild(card);
  }
}

function highlightLine(line,words){
  const uniqueWords=[...new Set(words.map((item)=>normalizeWord(item.word)))].filter(Boolean);
  if(!highlightEnabled||uniqueWords.length===0) return escapeHtml(line);
  const sorted=uniqueWords.sort((a,b)=>b.length-a.length).map((word)=>word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  const pattern=new RegExp(`\\b(${sorted.join("|")})\\b`,"gi");
  return escapeHtml(line).replace(pattern,'<span class="word-highlight">$1</span>');
}

function renderArticleContent(){
  const words=getDisplayedWords();
  cleanedText.classList.remove("empty");
  const sourceLines=currentDisplayLines.length?currentDisplayLines:currentSentenceLines;
  cleanedText.innerHTML=sourceLines.map((line)=>`<p class="article-line">${highlightLine(line,words)}</p>`).join("");
}

function persistArticleContent(){
  localStorage.setItem("cleanedArticleText",currentCleanedText||"");
  localStorage.setItem("cleanedArticleLines",JSON.stringify(currentSentenceLines||[]));
  localStorage.setItem("bilingualArticlePairs",JSON.stringify(currentBilingualPairs||[]));
  localStorage.setItem("displayArticleLines",JSON.stringify(currentDisplayLines||[]));
  localStorage.setItem("highlightWords",JSON.stringify(getDisplayedWords().map((item)=>item.word)));
}

function setLoadingState(isLoading){
  analyzeButton.disabled=isLoading; analyzeRawButton.disabled=isLoading; analyzeBilingualButton.disabled=isLoading;
  analyzeButton.textContent=isLoading?"分析中...":"智能分析当前内容";
  analyzeRawButton.textContent=isLoading?"分析中...":"分析原始字幕";
  analyzeBilingualButton.textContent=isLoading?"分析中...":"分析双语字幕";
  document.body.classList.toggle("loading",isLoading);
}

function setInputCollapsed(collapsed){
  inputCollapsed=collapsed;
  inputPanelBody.classList.toggle("collapsed-body",collapsed);
  toggleInputButton.classList.remove("hidden");
  toggleInputButton.textContent=collapsed?"展开输入":"隐藏输入";
}

function setWordMode(mode){
  currentWordMode=mode;
  perSentenceButton.classList.toggle("active-mode",mode==="perSentence");
  topHundredButton.classList.toggle("active-mode",mode==="topHundred");
  renderVocabulary(getDisplayedWords());
  if(currentSentenceLines.length){renderArticleContent();persistArticleContent();}
}

function resetPanels(){
  currentCleanedText=""; currentSentenceLines=[]; currentBilingualPairs=[]; currentDisplayLines=[]; perSentenceWords=[]; longestWords=[];
  localStorage.removeItem("cleanedArticleText"); localStorage.removeItem("cleanedArticleLines"); localStorage.removeItem("bilingualArticlePairs"); localStorage.removeItem("displayArticleLines"); localStorage.removeItem("highlightWords");
  cleanedText.classList.add("empty"); cleanedText.textContent="分析后，这里会显示按句换行的英文正文。";
  renderMessage(vocabularyList,"等待分析结果..."); wordCountLabel.textContent="等待分析结果..."; modeBadge.textContent="本地演示分析";
  downloadTextButton.classList.add("hidden"); openArticleButton.classList.add("hidden"); toggleHighlightButton.classList.add("hidden");
  perSentenceButton.classList.add("hidden"); topHundredButton.classList.add("hidden"); exportWordsButton.classList.add("hidden");
  highlightEnabled=true; toggleHighlightButton.textContent="关闭高亮"; setInputCollapsed(false);
}

function exportWords(){
  const words=getDisplayedWords();
  if(!words.length) return;
  const rows=words.map((item)=>[item.word,item.meaning||"",(item.sentence||"").replace(/\t/g," ").replace(/\r?\n/g," "),item.count||""].join("\t"));
  downloadFile(currentWordMode==="topHundred"?"top-100-words.tsv":"per-sentence-words.tsv",`word\tmeaning\tsentence\tcount\n${rows.join("\n")}`,"text/tab-separated-values;charset=utf-8");
}

async function analyze(mode="auto"){
  const rawText=subtitleInput.value.trim();
  const bilingualText=bilingualInput.value.trim();
  const useBilingual=mode==="bilingual"||(mode==="auto"&&!rawText&&Boolean(bilingualText));
  const useRaw=mode==="raw"||(mode==="auto"&&Boolean(rawText));
  if(!useRaw&&!useBilingual){alert("请先粘贴要分析的内容。");return;}
  if(mode==="raw"&&!rawText){alert("请先在原始字幕输入框中粘贴内容。");return;}
  if(mode==="bilingual"&&!bilingualText){alert("请先在双语字幕输入框中粘贴内容。");return;}

  setLoadingState(true);
  try{
    currentDisplayLines=useBilingual?getBilingualDisplayLines(bilingualText):[];
    currentBilingualPairs=useBilingual?parseBilingualInput(bilingualText):[];
    const bilingualEnglishLines=useBilingual?getEnglishLinesFromBilingualDisplay(currentDisplayLines):[];
    const englishSource=bilingualEnglishLines.length?bilingualEnglishLines.join(" "):rawText;
    const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:englishSource})});
    const data=await response.json();
    const result=data.fallback||data;
    if(!response.ok&&!data.fallback) throw new Error(data.error||"分析失败");

    currentCleanedText=result.cleanedText||englishSource;
    currentSentenceLines=useBilingual?bilingualEnglishLines:(result.sentenceLines||splitSentences(currentCleanedText));
    if(!useBilingual){
      currentDisplayLines=[...currentSentenceLines];
    }
    perSentenceWords=(result.vocabulary||[]).map((item)=>({word:normalizeWord(item.word),level:item.level,meaning:item.meaning||simpleMeaningForWord(item.word),sentence:item.sentence||""}));
    longestWords=buildTopLongestWords(currentSentenceLines);

    renderArticleContent();
    modeBadge.textContent=currentBilingualPairs.length?"双语阅读分析":(result.mode==="ai"?"AI 深度分析":"本地演示分析");
    downloadTextButton.classList.toggle("hidden",!currentCleanedText);
    openArticleButton.classList.toggle("hidden",!currentCleanedText);
    toggleHighlightButton.classList.toggle("hidden",!currentCleanedText);
    perSentenceButton.classList.toggle("hidden",perSentenceWords.length===0);
    topHundredButton.classList.toggle("hidden",longestWords.length===0);
    setWordMode(longestWords.length?"topHundred":"perSentence");
    exportWordsButton.classList.toggle("hidden",getDisplayedWords().length===0);
    setInputCollapsed(true);
    persistArticleContent();
    subtitleInput.value=""; bilingualInput.value="";

    if(!response.ok&&data.error) alert(`${data.error}\n\n已切换为本地兜底分析结果。`);
  }catch(error){alert(error.message||"分析失败，请稍后重试。");}
  finally{setLoadingState(false);}
}

analyzeButton.addEventListener("click",()=>analyze("auto"));
analyzeRawButton.addEventListener("click",()=>analyze("raw"));
analyzeBilingualButton.addEventListener("click",()=>analyze("bilingual"));
sampleButton.addEventListener("click",()=>{subtitleInput.value=sampleSubtitle;bilingualInput.value=sampleBilingual;});
clearButton.addEventListener("click",()=>{subtitleInput.value="";bilingualInput.value="";resetPanels();});
importTextButton.addEventListener("click",()=>{textFileInput.click();});
textFileInput.addEventListener("change",async(event)=>{const file=event.target.files&&event.target.files[0];if(!file)return;const text=await file.text();bilingualInput.value=text;textFileInput.value="";});
toggleInputButton.addEventListener("click",()=>{setInputCollapsed(!inputCollapsed);});
toggleHighlightButton.addEventListener("click",()=>{highlightEnabled=!highlightEnabled;toggleHighlightButton.textContent=highlightEnabled?"关闭高亮":"开启高亮";renderArticleContent();persistArticleContent();});
downloadTextButton.addEventListener("click",()=>{if(!currentSentenceLines.length)return;downloadFile("cleaned-subtitles.txt",currentSentenceLines.join("\n"),"text/plain;charset=utf-8");});
openArticleButton.addEventListener("click",()=>{if(!currentCleanedText)return;persistArticleContent();window.open("/article.html","_blank","noopener");});
perSentenceButton.addEventListener("click",()=>{setWordMode("perSentence");exportWordsButton.classList.toggle("hidden",getDisplayedWords().length===0);});
topHundredButton.addEventListener("click",()=>{setWordMode("topHundred");exportWordsButton.classList.toggle("hidden",getDisplayedWords().length===0);});
exportWordsButton.addEventListener("click",exportWords);

resetPanels();
