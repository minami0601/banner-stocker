// Chatwork APIのベースURL
const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

// メッセージに添付されたファイルを取得する関数
function getChatworkMessageFiles(roomId, messageId) {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    throw new Error('Chatwork API token not found in script properties');
  }

  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/messages/${messageId}/files`;
  const options = {
    method: 'GET',
    headers: {
      'X-ChatWorkToken': token
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error('Error fetching files:', responseCode, response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error in getChatworkMessageFiles:', error);
    return null;
  }
}

// 画像のダウンロードURLを取得する関数
function getDownloadableImageUrl(roomId, fileId) {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    throw new Error('Chatwork API token not found in script properties');
  }

  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/files/${fileId}`;
  const options = {
    method: 'GET',
    headers: {
      'X-ChatWorkToken': token
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      const fileInfo = JSON.parse(response.getContentText());
      return fileInfo.download_url;
    } else {
      console.error('Error getting download URL:', responseCode, response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error in getDownloadableImageUrl:', error);
    return null;
  }
}
