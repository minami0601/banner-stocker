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

  console.log('Successfully got message body:', messageBody);
  const fileInfo = extractFileInfoFromMessage(messageBody);
  if (!fileInfo) {
    console.error('No file information found in message');
    return null;
  }

  console.log('Successfully extracted file info:', fileInfo);
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
      console.log('Message Data:', messageData);
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
  console.log('Processing message body for file info:', messageBody);

  try {
    // [info]タグ内のコンテンツを抽出
    const infoPattern = /\[info\].*?\[\/info\]/s;
    const infoMatch = messageBody.match(infoPattern);

    if (!infoMatch) {
      console.log('No [info] tag found in message');
      return null;
    }

    const infoContent = infoMatch[0];
    console.log('Found info content:', infoContent);

    // プレビューIDを抽出
    const previewPattern = /\[preview id=(\d+)[^\]]*\]/;
    const previewMatch = infoContent.match(previewPattern);

    if (!previewMatch) {
      console.log('No preview ID found in info content');
      return null;
    }

    const fileId = previewMatch[1];
    console.log('Found file ID:', fileId);

    // ファイル名を抽出（ダウンロードタグから）
    const downloadPattern = new RegExp(`\\[download:${fileId}\\](.*?)\\s*\\([^)]*\\)\\[\\/download\\]`);
    const downloadMatch = infoContent.match(downloadPattern);

    if (!downloadMatch) {
      console.log('No matching download tag found for file ID:', fileId);
      return null;
    }

  const filename = downloadMatch[1].trim();
  console.log('Found filename:', filename);

    return {
      file_id: fileId,
      filename: filename
    };
  } catch (error) {
    console.error('Error extracting file info:', error);
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
    console.log('File API Response Code:', responseCode);

    if (responseCode === 200) {
      const fileInfo = JSON.parse(response.getContentText());
      console.log('File Info:', fileInfo);

      if (fileInfo && fileInfo.download_url) {
        const downloadUrl = fileInfo.download_url;
        console.log('Got download URL:', downloadUrl);
        return downloadUrl;
      } else {
        console.error('No download URL in file info');
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
