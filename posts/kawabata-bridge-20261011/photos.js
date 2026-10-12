/* 川端橋：10 張旅程照片使用外部 HTTPS 圖片直連，不向 GitHub Pages 上傳影像。
 * Degoo 的 /share/ 是網頁而非圖片位址；取得並驗證各張照片的直接圖片網址後，
 * 將 src 填入對應欄位。尚未填寫時會保留連至原始 Degoo 相簿的無破圖備援。
 * 不要在此放 API token、私密 Cookie 或登入憑證。
 */
window.MIAOSHU_KAWABATA_PHOTOS = [
  { index: 1, src: "", alt: "回首川端橋：喵叔旅行照片 01", caption: "旅程的起點：重新遇見川端橋" },
  { index: 2, src: "", alt: "回首川端橋：喵叔旅行照片 02", caption: "河與橋：兩岸之間的相望" },
  { index: 3, src: "", alt: "回首川端橋：喵叔旅行照片 03", caption: "昔日川端町：名字裡的城市記憶" },
  { index: 4, src: "", alt: "回首川端橋：喵叔旅行照片 04", caption: "一座橋的細節：歷史的痕跡" },
  { index: 5, src: "", alt: "回首川端橋：喵叔旅行照片 05", caption: "結構與紋理：觀看老橋的方式" },
  { index: 6, src: "", alt: "回首川端橋：喵叔旅行照片 06", caption: "腳步與距離：橋上的慢時光" },
  { index: 7, src: "", alt: "回首川端橋：喵叔旅行照片 07", caption: "新橋與老橋：不同世代的對話" },
  { index: 8, src: "", alt: "回首川端橋：喵叔旅行照片 08", caption: "新店溪水岸：一條河的視角" },
  { index: 9, src: "", alt: "回首川端橋：喵叔旅行照片 09", caption: "回望：留住今天的感受" },
  { index: 10, src: "", alt: "回首川端橋：喵叔旅行照片 10", caption: "歸途：把故事帶回家" }
];
(()=>{
 const entries=window.MIAOSHU_KAWABATA_PHOTOS;
 const isImageURL=value=>{
   try{const url=new URL(value);return url.protocol==="https:" && !url.pathname.startsWith("/share/");}
   catch{return false;}
 };
 for(const item of entries){
   const figure=document.querySelector('[data-kawabata-photo="'+item.index+'"]');
   if(!figure||!isImageURL(item.src))continue;
   const holder=figure.querySelector(".photo-fallback");
   const image=new Image();
   image.loading=item.index<=2?"eager":"lazy";
   image.decoding="async";
   image.alt=item.alt||("川端橋旅行照片 "+item.index);
   image.referrerPolicy="no-referrer";
   image.addEventListener("load",()=>{holder?.remove();figure.prepend(image)},{once:true});
   image.addEventListener("error",()=>{image.remove()},{once:true});
   image.src=item.src;
 }
})();
