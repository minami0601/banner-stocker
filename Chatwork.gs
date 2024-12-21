// Chatwork APIのベースURL
const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

// メッセージに添付されたファイルを取得する関数
function getChatworkMessageFiles(roomId, messageId) {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    throw new Error('Chatwork API token not found in script properties');
  }

  // メッセージの詳細を取得して、その中からファイル情報を抽出
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
    console.log('API Response Code:', responseCode);
    console.log('API Response Headers:', response.getAllHeaders());

    if (responseCode === 200) {
      const messageData = JSON.parse(response.getContentText());
      console.log('Message Data:', messageData);

      // レスポンスの構造を確認
      if (!messageData.body) {
        console.error('Message body not found in response');
        return null;
      }

      // メッセージ本文からファイル情報を解析
      const fileInfo = extractFileInfoFromMessage(messageData.body);
      console.log('Extracted File Info:', fileInfo);

      if (fileInfo) {
        return [{
          file_id: fileInfo.fileId,
          filename: fileInfo.filename
        }];
      }
    } else {
      console.error('Error fetching message:', responseCode, response.getContentText());
      // エラーレスポンスの詳細をログ出力
      switch (responseCode) {
        case 400:
          console.error('Invalid request parameters');
          break;
        case 401:
          console.error('Authentication failed');
          break;
        case 403:
          console.error('Permission denied');
          break;
        case 404:
          console.error('Message not found');
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        default:
          console.error('Unknown error occurred');
      }
    }
    return null;
  } catch (error) {
    console.error('Error in getChatworkMessageFiles:', error);
    return null;
  }
}

// メッセージ本文からファイル情報を抽出する関数
function extractFileInfoFromMessage(messageBody) {
  console.log('Processing message body:', messageBody);

  // Chatworkのファイル添付形式を正規表現で検出
  // [info][title]...[/title][preview id=1234...]の形式も考慮
  const filePatterns = [
    /\[download:(\d+)\](.*?)\s*\([^)]*\)\[\/download\]/,  // 通常の添付ファイル形式
    /\[preview id=(\d+)[^\]]*\].*?\[download:\1\](.*?)\s*\([^)]*\)\[\/download\]/  // プレビュー付きの形式
  ];

  for (const pattern of filePatterns) {
    const match = messageBody.match(pattern);
    if (match) {
      const fileInfo = {
        fileId: match[1],
        filename: match[2].trim()
      };
      console.log('Found file info:', fileInfo);
      return fileInfo;
    }
  }

  console.log('No file information found in message');
  return null;
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
        // ダウンロードURLにAPIトークンを追加
        const downloadUrl = fileInfo.download_url;
        console.log('Download URL:', downloadUrl);
        return downloadUrl;  // APIから返されたURLをそのまま使用
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
