# Banner Stocker セットアップガイド

## 1. Google Apps Script (GAS) プロジェクトの作成

1. [Google Apps Script](https://script.google.com/) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「Banner Stocker」に変更

## 2. コードの実装

以下の3つのファイルを作成し、それぞれコードを実装します：

1. `Code.gs`
2. `Spreadsheet.gs`
3. `Chatwork.gs`

## 3. Google Drive APIの有効化

1. GASエディタの「サービス」をクリック
2. 「サービスを追加」をクリック
3. 「Drive API」を選択して「追加」をクリック

## 4. Google Sheets APIの有効化

1. 同じく「サービス」から
2. 「サービスを追加」をクリック
3. 「Sheets API」を選択して「追加」をクリック

## 5. Chatwork APIトークンの取得

1. [Chatworkの開発者ページ](https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php)にアクセス
2. 「新しいAPIトークンを発行する」をクリック
3. 以下の権限を選択：
   - `rooms.messages.read`
   - `rooms.files.read`
4. 発行されたAPIトークンをコピー

## 6. スクリプトプロパティの設定

1. GASエディタの「プロジェクトの設定」をクリック
2. 「スクリプトプロパティ」セクションで「プロパティを追加」をクリック
3. 以下の設定を追加：
   - プロパティ：`CHATWORK_API_TOKEN`
   - 値：コピーしたAPIトークン

## 7. GASのデプロイ

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 「種類の選択」で「ウェブアプリ」を選択
3. 以下の設定を行う：
   - 説明：「Banner Stocker Webhook Endpoint」
   - 次のユーザーとして実行：「自分」
   - アクセスできるユーザー：「全員」
4. 「デプロイ」をクリック
5. 必要な権限を承認
6. デプロイされたURLをコピー

## 8. Chatwork Webhookの設定

1. Chatworkの対象チャットルームの設定を開く
2. 「Webhook」タブを選択
3. 「Webhook URL追加」をクリック
4. 以下の設定を行う：
   - Webhook名：「Banner Stocker」
   - Endpoint URL：GASでデプロイしたURL
   - イベント：「メッセージ作成」を選択
5. 「追加」をクリック

## 9. スプレッドシートの準備

1. 新しいGoogle スプレッドシートを作成
2. スプレッドシート名を���Banner Stock」に変更
3. GASプロジェクトのコードでこのスプレッドシートのIDを設定

## 10. 動作確認

1. Chatworkの対象ルームで以下の形式でメッセージを投稿：
   ```
   [バナー画像を添付]
   https://example.com/lp-url
   ジャンル：美容
   ```
2. スプレッドシートを確認し、以下が登録されていることを確認：
   - 投稿日時
   - バナー画像（プレビュー）
   - LP URL
   - ジャンル

## トラブルシューティング

### よくあるエラー

1. **画像が表示されない**
   - Google Driveの共有設定を確認
   - スプレッドシートのIMAGE関数の動作を確認

2. **Webhookが動作しない**
   - デプロイしたURLが正しいか確認
   - Webhookの設定が有効になっているか確認

3. **APIエラー**
   - APIトークンの有効期限を確認
   - スクリプトプロパティが正しく設定されているか確認

### ログの確認方法

1. GASエディタの「表示」→「実行ログ」を選択
2. エラーメッセージを確認
