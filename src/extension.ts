import * as vscode from 'vscode';
import fetch from 'node-fetch';

let myStatusBarItem: vscode.StatusBarItem;
let config = vscode.workspace.getConfiguration();
let userId = config.get('conf.dota-extension.user-dota-buff-id');

export async function activate({ subscriptions }: vscode.ExtensionContext) {
	const updateIdCommand = 'dota-extension.update-user-id';
	subscriptions.push(vscode.commands.registerCommand(updateIdCommand, async () => {
		let userInput = await vscode.window.showInputBox({
			placeHolder: "Dotabuff ID",
			prompt: "Enter your dotabuff ID",
			value: `${userId}`
		});

		if (userInput !== null) {
			userId = userInput;
		}

		config.update('conf.dota-extension.user-dota-buff-id', userId, vscode.ConfigurationTarget.Global);
		await updateStatusBarItem();
	}));

	const lastGameIdCommand = 'dota-extension.show-last-game';
	subscriptions.push(vscode.commands.registerCommand(lastGameIdCommand, async () => {
		const response = await fetch(`https://ru.dotabuff.com/players/${userId}/matches`, {
			headers: {
				'Host': 'ru.dotabuff.com',
				'Connection': 'keep-alive',
				'User-Agent': 'PostmanRuntime/7.29.2'
			}
		});
		
		let text = await response.text();

		let regex = new RegExp('<a href=\"\/matches\/[^<]*<\/a>');
		let gameHero = regex.exec(text)![0];
		regex = new RegExp('>[^<]*<');
		gameHero = regex.exec(gameHero)![0].replace('<', '');
		regex = new RegExp('[A-z]+$');
		gameHero = regex.exec(gameHero)![0];

		regex = new RegExp('<a class=\"[^\"]*\" href=\"\/matches\/[^<]*<\/a>');
		let gameResult = regex.exec(text)![0];
		regex = new RegExp('>[^<]*<');
		gameResult = regex.exec(gameResult)![0].replace('<', '');
		regex = new RegExp('[А-я]+$');
		gameResult = regex.exec(gameResult)![0];

		regex = new RegExp('<td>[^<]+<');
		let gameDuration = regex.exec(text)![0];
		regex = new RegExp('>[^<]+<');
		gameDuration = regex.exec(gameDuration)![0].replace('<', '').replace('>', '');

		regex = new RegExp('<span class\="value">[^<]*<');
		let gameKills = regex.exec(text)![0];
		regex = new RegExp('>[^<]+<');
		gameKills = regex.exec(gameKills)![0].replace('<', '').replace('>', '');

		vscode.window.showInformationMessage(`${gameResult} в игре на ${gameHero} длительностью ${gameDuration}. В игре вы совершили ${gameKills} убийств.`);
	}));

	subscriptions.push(vscode.workspace.onDidChangeConfiguration(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.tooltip = "Show last dota game info";
	myStatusBarItem.command = lastGameIdCommand;
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