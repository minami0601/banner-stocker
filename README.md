# Banner Stocker

Chatworkに投稿されたバナー画像を自動的にGoogle スプレッドシートで管理するシステムです。

## 機能

- Chatworkへの投稿をトリガーとした自動保存
- バナー画像のGoogle Drive保存
- ジャンル別のスプレッドシート管理
- 画像プレビュー付きの一覧表示

## セットアップ

1. Google Apps Script プロジェクトの作成
2. 必要なファイルのアップロード
   - `Code.gs`
   - `Spreadsheet.gs`
   - `Chatwork.gs`

3. スクリプトプロパティの設定
   - `CHATWORK_API_TOKEN`: ChatworkのAPIトークン

4. 必要な権限の有効化
   - Google Drive API
   - Google Sheets API

5. Webhookの設定
   - GASをウェブアプリとしてデプロイ
   - デプロイしたURLをChatworkのWebhook設定に登録

## 使用方法

1. Chatworkの指定されたルームに以下の形式で投稿：
   - バナー画像を添付
   - LPのURLを記載
   - ジャンルを指定（例：`ジャンル：美容` または `#美容`）

2. 自動的にスプレッドシートに保存され、以下の情報が記録���れます：
   - 投稿日時
   - バナー画像（プレビュー付き）
   - LP URL
   - ジャンル

## 注意事項

- バナー画像は自動的にGoogle Driveの`BannerStock Images`フォルダに保存されます
- スプレッドシートは自動的にジャンル別のシートを作成します
- 目次シートから各ジャンルのシートに簡単にアクセスできます
