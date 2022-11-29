import * as vscode from 'vscode';
import fetch from 'node-fetch';

let myStatusBarItem: vscode.StatusBarItem;
let config = vscode.workspace.getConfiguration();
let userId = config.get('conf.dota-extension.user-dota-buff-id');

export async function activate({ subscriptions }: vscode.ExtensionContext) {
	const myCommandId = 'dota-extension.update-user-id';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, async () => {
		//TODO: Чтобы был промт, где написано, что пользователь должен id ввести.
		userId = await vscode.window.showInputBox();
		config.update('conf.dota-extension.user-dota-buff-id', userId);
		await updateStatusBarItem();
	}));

	subscriptions.push(vscode.workspace.onDidChangeConfiguration(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.tooltip = "Change dota buff user id"
	myStatusBarItem.command = myCommandId;
	subscriptions.push(myStatusBarItem);

	await updateStatusBarItem();
}

async function updateStatusBarItem() {
	if (userId === null) {
		return;
	}

	const response = await fetch(`https://ru.dotabuff.com/players/${userId}/matches`, {
		headers: {
			'Host': 'ru.dotabuff.com',
			'Connection': 'keep-alive',
			'User-Agent': 'PostmanRuntime/7.29.2'
		}
	});

	let text = await response.text();
	let regex = new RegExp('<time datetime=[^<]*>');
	let timeTags = regex.exec(text);

	if (timeTags !== null) {
		let timeTag = timeTags[0];
		regex = new RegExp('title=\"[^"]*\"');
		let time = regex.exec(timeTag)![0].replace('title\=\"', '').replace(' +0000\"', '');
		
		myStatusBarItem.text = 'Последняя игра в доту была в ' + time;
		myStatusBarItem.show();
	}
}