export type Game = {
  slug: string; title: string; subtitle?: string; platform: 'DOS' | 'Macintosh' | 'Windows';
  year: string; creator: string; kind: 'dos' | 'mac' | 'pinball'; description: string;
  controls: string[]; start?: string; size: string; source: string; sourceLabel: string; color: string;
};
export const games: Game[] = [
  { slug: 'mystic-towers', title: 'Mystic Towers', platform: 'DOS', year: '1994', creator: 'Animation FX / Apogee', kind: 'dos', color: '#8fae70', size: '1.3 MB',
    description: 'Baron Baldric, a tower full of monsters, and puzzles to work out room by room.',
    start: 'Press Enter to accept the hardware detection screen, then follow the menu to start a game.',
    controls: ['Arrow keys move Baldric. Enter selects a menu option.', 'Check the in-game help for spells and inventory controls.'],
    source: 'https://archive.org/details/msdos_Mystic_Towers_1994', sourceLabel: 'Archived game and documentation' },
  { slug: 'hocus-pocus', title: 'Hocus Pocus', platform: 'DOS', year: '1994', creator: 'Moonlite Software / Apogee', kind: 'dos', color: '#ab8cdb', size: '1.3 MB',
    description: 'A little wizard, bright levels, and a lot of lightning bolts.',
    controls: ['Arrow keys move. Ctrl jumps. Alt fires.', 'Enter selects; Escape opens the menu. Controls can be changed in the game.'],
    source: 'https://archive.org/details/msdos_Hocus_Pocus_1994', sourceLabel: 'Archived game and documentation' },
  { slug: 'hand-of-fate', title: 'Hand of Fate', subtitle: 'The Legend of Kyrandia, Book Two', platform: 'DOS', year: '1993', creator: 'Westwood Studios / Virgin Games', kind: 'dos', color: '#71b9ba', size: 'Large download',
    description: 'Zanthia the Alchemist, strange ingredients, and the adventure I played beside my mom.',
    controls: ['Use the mouse to walk, examine things, and pick up objects.', 'Click an inventory item to use it. The game menu includes save and load.'],
    source: 'https://archive.org/details/msdos_Legend_of_Kyrandia_Book_2_-_The_Hand_of_Fate_1993', sourceLabel: 'Archived CD edition' },
  { slug: 'space-cadet', title: 'Space Cadet', subtitle: '3D Pinball', platform: 'Windows', year: '1995', creator: 'Cinematronics / Maxis; browser port by the Space Cadet community', kind: 'pinball', color: '#779cde', size: '9 MB',
    description: 'The space pinball table. I remembered it while putting this collection together.',
    controls: ['Hold Space to pull the plunger, then release to launch.', 'Z controls the left flipper; C or / controls the right. R starts a new game.', 'T toggles sound. Touch controls are available on the table.'],
    source: 'https://github.com/lrusso/3DPinballSpaceCadet', sourceLabel: 'Browser port and source credits' },
  { slug: 'chrysanthemum', title: 'Chrysanthemum', platform: 'Macintosh', year: '1993', creator: 'Ryan Koopmans', kind: 'mac', color: '#dcae86', size: '2 MB disk + Mac system',
    description: 'A flower-arranging puzzle game. One of the names that brought the memories straight back.',
    start: 'Open the Arcade disk, then the Chrysanthemum 1.01 folder, and double-click the application.',
    controls: ['Choose Play Game on the title screen. Choose Keys lets you check or change the controls; Instructions explains the flower puzzle.', 'If the Mac asks for a colour mode, choose 256 colours in Control Panels → Monitors.'],
    source: 'https://archive.org/details/macsilverware', sourceLabel: 'Original MacSilverWare disc' },
  { slug: 'armor', title: 'Armor', platform: 'Macintosh', year: '1991', creator: 'Brad Sanders', kind: 'mac', color: '#a7b28b', size: '2 MB disk + Mac system',
    description: 'A turn-based tank game I could describe without being able to find it.',
    start: 'Open the Arcade disk, then the Armor 1.1 folder and application. Choose File → Begin (Command-B) to start.',
    controls: ['Use the mouse to select a tank and its destination.', 'Choose the mission and difficulty from the Mission and Options menus. Hold the mouse button down to open a classic Mac menu, then release on your choice.'],
    source: 'https://archive.org/details/macsilverware', sourceLabel: 'Original MacSilverWare disc' },
  { slug: 'swoop', title: 'Swoop', platform: 'Macintosh', year: '1995', creator: 'David and Sheryn Wareing / Ambrosia Software', kind: 'mac', color: '#d98983', size: '4 MB disk + Mac system',
    description: 'The one I remembered as Galaga with insects.',
    start: 'Open the Arcade disk, then Swoop 1.0.1, and double-click Swoop. At the original shareware notice, wait for Not Yet to become available, then choose it.',
    controls: ['Use the game’s Controls option on the title screen to check or change the movement and fire keys.', 'The original readme and registration information are on the disk.'],
    source: 'https://archive.org/details/IMG31Oct1995', sourceLabel: 'Original Inside Mac Games disc' },
  { slug: 'taskmaker', title: 'TaskMaker', platform: 'Macintosh', year: '1989 / 1993 colour edition', creator: 'XOR Corporation / Storm Impact', kind: 'mac', color: '#ba9bce', size: '4 MB disk + Mac system',
    description: 'A world that advances one step at a time, with tasks, secrets, and plenty to explore.',
    start: 'Open the Arcade disk, then TaskMaker 2.0, and double-click the application.',
    controls: ['Use the keyboard to move and the menus to choose actions.', 'The original manual is included in the game folder.'],
    source: 'https://archive.org/details/macsilverware', sourceLabel: 'Original MacSilverWare disc' },
  { slug: 'busytown', title: 'How Things Work in Busytown', subtitle: 'Richard Scarry’s', platform: 'DOS', year: '1994', creator: 'Novotrade / Simon & Schuster', kind: 'dos', color: '#dfb75d', size: 'Large download',
    description: 'Richard Scarry’s world, with places to visit and things to take apart and figure out.',
    controls: ['Point and click to explore. Click inside the player first if the mouse does not respond.'],
    source: 'https://archive.org/details/msdos_Richard_Scarrys_How_Things_Work_in_Busytown_1994', sourceLabel: 'Archived CD edition' },
  { slug: 'x-wing', title: 'Star Wars: X-Wing', subtitle: 'Collector’s CD-ROM', platform: 'DOS', year: '1993 / 1994 CD edition', creator: 'Totally Games / LucasArts', kind: 'dos', color: '#73a7c8', size: 'Large download',
    description: 'I played this one a ton. I remember getting a joystick too.',
    start: 'The original opening sequence plays first. Give it a few minutes to reach pilot registration.',
    controls: ['Type a pilot name or select one from the list. Click the door on the left to enter the concourse, then choose Pilot Proving Ground for training. Pick your craft and level, then click the door on the right to enter the course. Backspace sets full throttle in the cockpit.', 'Mouse and keyboard are recommended here. A physical joystick has not been verified with this browser version.'],
    source: 'https://archive.org/details/star-wars-x-wing', sourceLabel: 'Archived Collector’s CD-ROM' },
  { slug: 'grand-theft-auto-2', title: 'Grand Theft Auto 2', platform: 'Windows', year: '1999', creator: 'DMA Design / Rockstar Games; Windows package preserved by the DOS.Zone community', kind: 'dos', color: '#c9ad61', size: 'Windows disk streams as you play',
    description: 'The game behind those late-night demo downloads on Bob’s computer.',
    start: 'Windows 95 starts first, then the game opens. Give it about a minute on the first launch. Choose Play to enter the city.',
    controls: ['Use the arrow keys to move. Enter gets in and out of a vehicle.', 'The Options menu includes the keyboard controls. A desktop browser works best.'],
    source: 'https://dos.zone/dos-theft-auto2/', sourceLabel: 'Community browser package and preservation credits' },
  { slug: 'grand-theft-auto', title: 'Grand Theft Auto', subtitle: 'An extra from the same era', platform: 'DOS', year: '1997', creator: 'DMA Design', kind: 'dos', color: '#d39463', size: '32 MB',
    description: 'The original top-down GTA. The late-night demo download in my story was GTA 2; this is its predecessor.',
    controls: ['Arrow keys move or drive. Enter gets in and out of a vehicle.', 'Use the game menu to check the rest of the keyboard controls.'],
    source: 'https://archive.org/details/grand-theft-auto-1997-dma-design', sourceLabel: 'Archived DOS edition' },
];
export const runtimeOrigin = import.meta.env.PUBLIC_ARCADE_ORIGIN ?? (import.meta.env.DEV ? 'http://localhost:4127' : 'https://arcade.probablyfine.dev');
export const storyPath = '/blog/i-just-wanted-to-play-games';
export function playerUrl(game: Game) {
  if (game.kind === 'dos') return `${runtimeOrigin}/arcade/runtime/dos.html?game=${game.slug}`;
  if (game.kind === 'pinball') return `${runtimeOrigin}/arcade/assets/space-cadet/3DPinballSpaceCadet.htm`;
  const params = new URLSearchParams({ disk: 'System 7.5', screenSize: '640x480', auto_pause: 'false', library: 'false', saved_hd: 'true', disk_url: `${runtimeOrigin}/arcade/assets/${game.slug}.hfv` });
  return `${runtimeOrigin}/embed?${params}`;
}
