// Chatwork APIのベースURL
const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

// メッセージから画像情報を取得する関数
function getChatworkMessageFiles(roomId, messageId) {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    throw new Error('Chatwork API token is not set');
  }

  const options = {
    'method': 'get',
    'headers': {
      'X-ChatWorkToken': token
    }
  };

  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/messages/${messageId}/files`;
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

// Chatworkの画像URLを取得可能な形式に変換する関数
function getDownloadableImageUrl(roomId, fileId) {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    throw new Error('Chatwork API token is not set');
  }

  const options = {
    'method': 'get',
    'headers': {
      'X-ChatWorkToken': token
    }
  };

  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/files/${fileId}`;
  const response = UrlFetchApp.fetch(url, options);
  const fileInfo = JSON.parse(response.getContentText());

  return fileInfo.download_url;
}
