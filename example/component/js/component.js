var UselessClass = function() {
    // TODO: nothing
};

UselessClass.prototype = {
    doSomething : function() {
        throw new Error('User attempted to do something useful');
    }
};
