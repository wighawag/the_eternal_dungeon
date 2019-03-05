let project = new Project('The Ethernal Dungeon');
project.addAssets('Assets/**');
project.addShaders('Shaders/**');
project.addSources('Sources');
project.addLibrary('base');
resolve(project);
