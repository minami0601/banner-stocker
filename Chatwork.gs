// Chatwork APIのベースURL
const CHATWORK_API_BASE_URL = 'https://api.chatwork.com/v2';

// Chatworkのメッセージを取得する関数
function getChatworkMessage(roomId, messageId) {
  console.log('Getting message details for room:', roomId, 'message:', messageId);

  try {
    const url = `${CHATWORK_API_BASE_URL}/rooms/${roomId}/messages/${messageId}`;
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'X-ChatWorkToken': getChatworkToken()
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      const messageData = JSON.parse(response.getContentText());
      console.log('Retrieved message data:', messageData);
      return messageData;
    } else {
      console.error('Failed to get message. Status code:', response.getResponseCode());
      console.error('Response:', response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error getting message:', error);
    return null;
  }
}

// メッセージに添付されたファイルを取得する関数
function getChatworkMessageFiles(roomId, messageId) {
  console.log('Getting files for room:', roomId, 'message:', messageId);

  try {
    const url = `${CHATWORK_API_BASE_URL}/rooms/${roomId}/files?message_id=${messageId}`;
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'X-ChatWorkToken': getChatworkToken()
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      const files = JSON.parse(response.getContentText());
      console.log('Retrieved files:', files);
      return files;
    } else {
      console.error('Failed to get files. Status code:', response.getResponseCode());
      console.error('Response:', response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error getting files:', error);
    return null;
  }
}

// ファイルのダウンロードURLを取得する関数
function getDownloadableImageUrl(roomId, fileId) {
  console.log('Getting download URL for room:', roomId, 'file:', fileId);

  try {
    const url = `${CHATWORK_API_BASE_URL}/rooms/${roomId}/files/${fileId}`;
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'X-ChatWorkToken': getChatworkToken()
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      const fileData = JSON.parse(response.getContentText());
      console.log('Retrieved file data:', fileData);
      return fileData.download_url;
    } else {
      console.error('Failed to get download URL. Status code:', response.getResponseCode());
      console.error('Response:', response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error getting download URL:', error);
    return null;
  }
}

// Chatworkトークンを取得する関数
function getChatworkToken() {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    throw new Error('Chatwork API token not found in script properties');
  }
  return token;
}

// テスト用の関数
function testChatworkApi() {
  // テスト用のルームIDとメッセージID
  const roomId = 'YOUR_ROOM_ID';
  const messageId = 'YOUR_MESSAGE_ID';

  // メッセージの取得をテスト
  const message = getChatworkMessage(roomId, messageId);
  console.log('Test message:', message);

  // ファイルの取得をテスト
  const files = getChatworkMessageFiles(roomId, messageId);
  console.log('Test files:', files);

  if (files && files.length > 0) {
    // ダウンロードURLの取得をテスト
    const downloadUrl = getDownloadableImageUrl(roomId, files[0].file_id);
    console.log('Test download URL:', downloadUrl);
  }
}
