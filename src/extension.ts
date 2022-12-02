import * as vscode from 'vscode';
import fetch from 'node-fetch';

let myStatusBarItem: vscode.StatusBarItem;
let config = vscode.workspace.getConfiguration();
let userId = config.get('conf.dota-extension.user-dota-id');

export async function activate({ subscriptions }: vscode.ExtensionContext) {
	const updateIdCommand = 'dota-extension.update-user-id';
	subscriptions.push(vscode.commands.registerCommand(updateIdCommand, async () => {
		let userInput = await vscode.window.showInputBox({
			placeHolder: "Dota ID",
			prompt: "Enter your dota ID",
			value: `${userId}`
		});

		if (userInput !== null && userInput !== undefined) {
			userId = userInput;
		}

		config.update('conf.dota-extension.user-dota-id', userId, vscode.ConfigurationTarget.Global);
		await updateStatusBarItem();
	}));

	const lastGameIdCommand = 'dota-extension.show-last-game';
	subscriptions.push(vscode.commands.registerCommand(lastGameIdCommand, async () => {
		try {
			const response = await fetch(`https://api.opendota.com/api/players/${userId}/recentMatches`);
			
			let text = await response.text();

			let json = JSON.parse(text)[0];
			
			let duration = `${get2Numbers(Math.floor(json['duration'] / 60))}:${get2Numbers(json['duration'] % 60)}`;
			let result = '';
			if (json['player_slot'] <= 127) {
				result = json['radiant_win'] ? 'Victory' : 'Defeat';
			}
			else {
				result = !json['radiant_win'] ? 'Victory' : 'Defeat';
			}

			let kills = json['kills'];
			let deaths = json['deaths'];
			let assists = json['assists'];

			let hero_id = json['hero_id'];
			const heroes = await fetch(`https://api.opendota.com/api/heroes`);
			let heroes_text = await heroes.text();
			let heroes_json = JSON.parse(heroes_text);
			let hero_name = '';

			for (let i = 0; i <= heroes_json.length; i++) {
				let hero_json = heroes_json[i];
				if (hero_json.hasOwnProperty('id') && hero_json['id'] == hero_id) {
					hero_name = hero_json['localized_name'];
					break;
				}
			}

			vscode.window.showInformationMessage(`${result} in the game on ${hero_name} of duration ${duration}. You got ${kills} kills` +
			`, died ${deaths} times and ${assists} times assisted.`);
		}
		catch {
			vscode.window.showInformationMessage('Dota user ID is incorrect!');
		}
	}));

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.tooltip = "Show last dota game info";
	myStatusBarItem.command = lastGameIdCommand;
	subscriptions.push(myStatusBarItem);


	await updateStatusBarItem();
}

async function updateStatusBarItem() {
	try {
		const response = await fetch(`https://api.opendota.com/api/players/${userId}/recentMatches`);
			
		let text = await response.text();

		let json = JSON.parse(text)[0];
		let lastGameStartDate = new Date(json['start_time'] * 1000);
		let lastGameStart = `${get2Numbers(lastGameStartDate.getHours())}:${get2Numbers(lastGameStartDate.getMinutes())} ` +
		`${get2Numbers(lastGameStartDate.getDate())}.${get2Numbers(lastGameStartDate.getMonth() + 1)}.` +
		`${lastGameStartDate.getFullYear()}`;
			
		myStatusBarItem.text = 'Last Dota 2 Game Time: ' + lastGameStart;
		myStatusBarItem.show();
	}
	catch {
		vscode.window.showInformationMessage('Dota user ID is incorrect!');
	}

	setTimeout(updateStatusBarItem, 120000);
}

function get2Numbers(x: any) {
	x = String(x);
	return x.length == 2 ? x : `0` + x;
}