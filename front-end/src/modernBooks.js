// Bibliographic details checked against the linked publisher/author sources, 20 September 2026.
// Descriptions are original reading prompts. These licensed works are not copied into Learnify.
const edition=(title,author,url,description,topics,stages=['Grade 8','IGCSE'])=>({id:'modern-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),title,author,url,source:url,description,topics,stages,subject:'english',language:'English',access:'publisher',connection:'Optional wider reading',rights:'Borrow a library copy or use an authorized publisher edition. This link provides official book information; a free full text is not included in Learnify.'});
const hp='https://www.bloomsbury.com/uk/harry-potter/';
const pj='https://rickriordan.com/series/percy-jackson-and-the-olympians/';
const hg='https://www.scholastic.com/newsroom/online-press-kits/hunger-games-series.html';
export const MODERN_BOOKS=[
 ...[
 ['Philosopher’s Stone','Notice how a new setting is introduced through an inexperienced character.'],
 ['Chamber of Secrets','Track clues and compare what readers know with what characters believe.'],
 ['Prisoner of Azkaban','Explore how a change of perspective can transform a mystery.'],
 ['Goblet of Fire','Follow competing loyalties and the way tension grows across a longer narrative.'],
 ['Order of the Phoenix','Consider the relationship between authority, evidence, and resistance.'],
 ['Half-Blood Prince','Track how memories and withheld information shape the reader’s expectations.'],
 ['Deathly Hallows','Compare the final choices with the values established earlier in the series.'],
 ].map(([name,prompt])=>edition('Harry Potter and the '+name,'J. K. Rowling',hp,prompt,['Fantasy','Friendship','Character'])),
 ...[
 ['The Lightning Thief','Connect a modern adventure with its Greek mythological references.'],
 ['The Sea of Monsters','Explore a quest narrative and the tests it sets for friendship.'],
 ['The Titan’s Curse','Notice how prophecies affect characters’ decisions and expectations.'],
 ['The Battle of the Labyrinth','Follow the relationship between setting, danger, and problem solving.'],
 ['The Last Olympian','Consider responsibility and sacrifice at the conclusion of a story arc.'],
 ['The Chalice of the Gods','Compare the demands of an everyday goal with a mythological adventure.'],
 ['Wrath of the Triple Goddess','Look for humour created by the contrast between ordinary tasks and extraordinary characters.'],
 ].map(([title,prompt])=>edition(title,'Rick Riordan',pj,prompt,['Mythology','Adventure','Friendship'])),
 ...[
 ['The Hunger Games','Explore how narrative voice shapes the reader’s view of power.'],
 ['Catching Fire','Track recurring symbols and how their meaning changes.'],
 ['Mockingjay','Consider how different groups use stories to influence people.'],
 ['The Ballad of Songbirds and Snakes','Compare perspective and motivation with the original trilogy.'],
 ['Sunrise on the Reaping','Investigate how a prequel changes the interpretation of an established world.'],
 ].map(([title,prompt])=>edition(title,'Suzanne Collins',hg,prompt,['Dystopia','Power','Perspective'],['IGCSE','IB'])),
 edition('Wonder','R. J. Palacio','https://www.penguinrandomhouse.com/books/208913/wonder-by-r-j-palacio/','Compare the voices of different narrators and how each changes your understanding of belonging.',['Empathy','Perspective','School life']),
 edition('The Book Thief','Markus Zusak','https://www.penguinrandomhouse.com/books/196153/the-book-thief-anniversary-edition-by-markus-zusak/','Examine the effect of an unusual narrator and the significance of words in a historical setting.',['Historical fiction','Narrative','Language'],['IGCSE','IB']),
 edition('Holes','Louis Sachar','https://www.penguinrandomhouse.com/books/159528/holes-by-louis-sachar/','Map the connections between different timelines and explain how small details become significant.',['Mystery','Friendship','Justice']),
];
