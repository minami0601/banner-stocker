// Webhookのヘルスチェック用エンドポイント
function doGet(e) {
  console.log('Received GET request:', JSON.stringify(e));
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 一時保存用のプロパティ名
const TEMP_IMAGE_PROPERTY_PREFIX = 'TEMP_IMAGE_';
const TEMP_IMAGE_TIMEOUT = 60000; // 1分（ミリ秒）

// Chatworkからのwebhookを受け取るエンドポイント
function doPost(e) {
  console.log('Received POST request. Starting processing...');

  try {
    // リクエストデータの取得と検証
    if (!e || !e.postData || !e.postData.contents) {
      console.error('Invalid request format:', JSON.stringify(e));
      throw new Error('Invalid request format');
    }

    // リクエストデータの解析
    console.log('Raw request data:', e.postData.contents);
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed webhook data:', JSON.stringify(data, null, 2));

    // webhook_eventの存在確認
    if (!data.webhook_event) {
      console.error('webhook_event not found in data');
      throw new Error('webhook_event not found');
    }

    // メッセージの処理
    const result = processMessage(data);
    console.log('Message processing result:', result);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Webhook processed successfully'
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error in doPost:', error.message);
    console.error('Error stack:', error.stack);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// メッセージを処理する関数
function processMessage(data) {
  console.log('Starting message processing...');

  try {
    const message = data.webhook_event;
    const messageId = message.message_id;
    const roomId = message.room_id;
    const messageBody = message.body;
    const timestamp = message.send_time * 1000; // Unix時間（秒）をミリ秒に変換

    console.log('Message details:', {
      messageId,
      roomId,
      messageBody,
      timestamp
    });

    // メッセージ本文に[file_uploaded]が含まれているかチェック
    if (messageBody.includes('[dtext:file_uploaded]')) {
      console.log('Image message detected, processing...');
      // ファイルIDを抽出
      const fileIdMatch = messageBody.match(/\[download:(\d+)\]/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        return handleImageMessage(roomId, messageId, { file_id: fileId }, timestamp);
      }
      return {
        status: 'error',
        message: 'Failed to extract file ID from image message'
      };
    }

    // URLを含むメッセージの場合はテキストメッセージとして処理
    if (messageBody.includes('http://') || messageBody.includes('https://')) {
      console.log('Text message detected, processing with saved image...');
      return handleTextMessage(roomId, messageBody, timestamp);
    }

    return {
      status: 'ignored',
      message: 'Message does not contain image or URL'
    };

  } catch (error) {
    console.error('Error in processMessage:', error);
    throw error;
  }
}

// 画像メッセージを処理する関数
function handleImageMessage(roomId, messageId, fileInfo, timestamp) {
  console.log('Handling image message:', { roomId, messageId, fileInfo, timestamp });

  const key = TEMP_IMAGE_PROPERTY_PREFIX + roomId;
  const imageData = {
    messageId: messageId,
    fileId: fileInfo.file_id,
    timestamp: timestamp
  };

  // 一時データを保存
  PropertiesService.getScriptProperties().setProperty(
    key,
    JSON.stringify(imageData)
  );

  console.log('Saved temporary image data:', imageData);

  return {
    status: 'success',
    message: 'Image saved temporarily. Waiting for text information.'
  };
}

// テキストメッセージを処理する関数
function handleTextMessage(roomId, messageBody, currentTimestamp) {
  console.log('Handling text message:', { roomId, messageBody, currentTimestamp });

  // 保存された画像情報を取得
  const key = TEMP_IMAGE_PROPERTY_PREFIX + roomId;
  const savedImageJson = PropertiesService.getScriptProperties().getProperty(key);

  if (!savedImageJson) {
    console.log('No saved image found');
    return {
      status: 'error',
      message: 'No image found. Please send image first.'
    };
  }

  const savedImage = JSON.parse(savedImageJson);
  console.log('Retrieved saved image data:', savedImage);

  // タイムアウトチェック
  if (currentTimestamp - savedImage.timestamp > TEMP_IMAGE_TIMEOUT) {
    console.log('Saved image has expired');
    PropertiesService.getScriptProperties().deleteProperty(key);
    return {
      status: 'error',
      message: 'Image data has expired. Please send image again.'
    };
  }

  // テキスト情報を抽出
  console.log('Extracting text information...');
  const urlInfo = extractLpUrl(messageBody);
  const genre = extractGenre(messageBody);
  const memo = extractMemo(messageBody);

  console.log('Extracted information:', { urlInfo, genre, memo });

  // 必要な情報が揃っているか確認
  if (!urlInfo || !genre) {
    console.log('Required text information missing');
    return {
      status: 'error',
      message: 'Required information missing in text'
    };
  }

  // 画像のダウンロードURLを取得
  console.log('Getting download URL for saved image...');
  const downloadUrl = getDownloadableImageUrl(roomId, savedImage.fileId);
  if (!downloadUrl) {
    console.log('Failed to get download URL');
    return {
      status: 'error',
      message: 'Failed to process image'
    };
  }

  // 画像をGoogle Driveに保存
  console.log('Saving image to Drive...');
  const imageUrl = saveImageToDrive(downloadUrl, `banner_${new Date().getTime()}.png`);
  if (!imageUrl) {
    console.log('Failed to save image to Drive');
    return {
      status: 'error',
      message: 'Failed to save image'
    };
  }

  // スプレッドシートに保存
  console.log('Saving to spreadsheet...');
  try {
    // URLの種類に応じて適切な値を設定
    let lpUrl = '';
    let videoUrl = '';

    switch (urlInfo.type) {
      case 'lp':
        lpUrl = urlInfo.lpUrl;
        break;
      case 'video':
        videoUrl = urlInfo.videoUrl;
        break;
      case 'both':
        lpUrl = urlInfo.lpUrl;
        videoUrl = urlInfo.videoUrl;
        break;
    }

    saveToSpreadsheet(imageUrl, lpUrl, genre, memo, videoUrl);
    console.log('Successfully saved to spreadsheet');
  } catch (error) {
    console.error('Error saving to spreadsheet:', error);
    return {
      status: 'error',
      message: 'Failed to save to spreadsheet'
    };
  }

  // 一時データを削除
  PropertiesService.getScriptProperties().deleteProperty(key);

  return {
    status: 'success',
    message: 'Successfully processed image and text'
  };
}

// LPのURLを抽出する関数
function extractLpUrl(message) {
  // メッセージを行に分割
  const lines = message.split('\n').filter(line => line.trim());
  if (lines.length === 0) return null;

  // URLを抽出する正規表現
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // 1行目を確認
  const firstLine = lines[0].trim();
  const firstLineMatches = firstLine.match(urlRegex);

  // 動画URLの場合
  if (firstLine.startsWith('動画') && firstLineMatches) {
    // 動画URLを設定
    const videoUrl = firstLineMatches[0];

    // 2行目にLP URLがあるか確認
    if (lines.length > 1) {
      const secondLine = lines[1].trim();
      const secondLineMatches = secondLine.match(urlRegex);
      if (secondLineMatches) {
        // LP URLが存在する場合は、動画URLとLP URLの両方を返す
        return {
          type: 'both',
          videoUrl: videoUrl,
          lpUrl: secondLineMatches[0]
        };
      }
    }

    // LP URLがない場合は動画URLのみ返す
    return {
      type: 'video',
      videoUrl: videoUrl
    };
  }

  // 通常のLP URLの場合
  if (firstLineMatches) {
    return {
      type: 'lp',
      lpUrl: firstLineMatches[0]
    };
  }

  return null;
}

// ジャンルを抽出する関数
function extractGenre(message) {
  // メッセージを行に分割
  const lines = message.split('\n').filter(line => line.trim());

  // URLを含まない最初の行をジャンルとして扱う
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.includes('http://') && !line.includes('https://')) {
      return line;
    }
  }

  return null;
}

// メモを抽出する関数
function extractMemo(message) {
  // メッセージを行に分割
  const lines = message.split('\n').filter(line => line.trim());

  // ジャンルの行を見つける
  let genreIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.includes('http://') && !line.includes('https://')) {
      genreIndex = i;
      break;
    }
  }

  // ジャンルの次の行以降をメモとして結合
  if (genreIndex !== -1 && genreIndex + 1 < lines.length) {
    return lines.slice(genreIndex + 1).join('\n').trim();
  }

  return '';  // メモがない場合は空文字を返す
}

// 画像をGoogle Driveに保存する関数
function saveImageToDrive(downloadUrl, filename) {
  console.log('Saving image to Drive:', { downloadUrl, filename });

  try {
    // 画像をダウンロード
    const response = UrlFetchApp.fetch(downloadUrl);
    const blob = response.getBlob();

    // フォルダを取得または作成
    const folder = getDriveFolder();

    // ファイルを作成
    const file = folder.createFile(blob);
    file.setName(filename);

    // 共有設定を変更（リンクを知っている人は誰でも閲覧可能）
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // スプレッドシートのIMAGE関数で表示可能なURLを生成
    const fileId = file.getId();
    const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    console.log('Successfully saved image to Drive:', driveUrl);
    return driveUrl;

  } catch (error) {
    console.error('Error saving image to Drive:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

// Google Driveのフォルダを取得または作成する関数
function getDriveFolder() {
  const folderName = 'BannerStock Images';
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(folderName);
}

// テスト用の関数
function testProcessMessage() {
  // テスト用のWebhookデータを作成
  const testData = {
    webhook_event: {
      message_id: "test_message_id",
      room_id: 123456,
      body: "テスト投稿です\nhttps://example.com/test\nジャンル：テスト\nメモ：��れはテストメモです",
      account: {
        account_id: 123456,
        name: "Test User"
      },
      send_time: Date.now()
    }
  };

  console.log('Starting test with data:', JSON.stringify(testData, null, 2));

  // processMessage関数を実行
  processMessage(testData);
}
