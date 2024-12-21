// Chatwork APIのベースURL
const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

// メッセージに添付されたファイルを取得する関数
function getChatworkMessageFiles(roomId, messageId) {
  console.log('Getting files for message:', { roomId, messageId });

  // メッセージ本文からファイル情報を直接抽出
  const messageBody = getMessageBody(roomId, messageId);
  if (!messageBody) {
    console.error('Failed to get message body');
    return null;
  }

  const fileInfo = extractFileInfoFromMessage(messageBody);
  if (!fileInfo) {
    console.error('No file information found in message');
    return null;
  }

  return [fileInfo];
}

// メッセージ本文を取得する関数
function getMessageBody(roomId, messageId) {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    throw new Error('Chatwork API token not found in script properties');
  }

  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/messages/${messageId}`;
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
    console.log('Message API Response Code:', responseCode);

    if (responseCode === 200) {
      const messageData = JSON.parse(response.getContentText());
      return messageData.body;
    } else {
      console.error('Error fetching message:', responseCode, response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error in getMessageBody:', error);
    return null;
  }
}

// メッセージ本文からファイル情報を抽出する関数
function extractFileInfoFromMessage(messageBody) {
  console.log('Processing message body:', messageBody);

  // プレビューIDとファイル名を抽出
  const previewPattern = /\[preview id=(\d+)[^\]]*\]/;
  const previewMatch = messageBody.match(previewPattern);

  if (!previewMatch) {
    console.log('No preview ID found in message');
    return null;
  }

  const fileId = previewMatch[1];
  console.log('Found file ID:', fileId);

  // ファイル名を抽出
  const downloadPattern = new RegExp(`\\[download:${fileId}\\](.*?)\\s*\\([^)]*\\)\\[\\/download\\]`);
  const downloadMatch = messageBody.match(downloadPattern);

  if (!downloadMatch) {
    console.log('No matching download tag found');
    return null;
  }

  const filename = downloadMatch[1].trim();
  console.log('Found filename:', filename);

  return {
    file_id: fileId,
    filename: filename
  };
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
    console.log('File API Response Code:', responseCode);

    if (responseCode === 200) {
      const fileInfo = JSON.parse(response.getContentText());
      console.log('File Info:', fileInfo);

      if (fileInfo && fileInfo.download_url) {
        return fileInfo.download_url;  // APIから返されたURLをそのまま使用
      }
    } else {
      console.error('Error getting download URL:', responseCode, response.getContentText());
    }
    return null;
  } catch (error) {
    console.error('Error in getDownloadableImageUrl:', error);
    return null;
  }
}
