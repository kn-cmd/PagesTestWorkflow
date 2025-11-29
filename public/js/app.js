// JSコード内に埋め込む例
// デプロイ時に実際のURLに置換されます
const apiBaseUrl = "${API_BASE_URL}";

document.getElementById("btn").addEventListener("click", () => {
    alert("設定されているAPI URL:\n" + apiBaseUrl);
});
