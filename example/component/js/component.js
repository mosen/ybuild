var UselessClass = function() {
    // TODO: nothing
};

UselessClass.prototype = {
    doSomething : function() {
        Y.log('Log statement here');
        throw new Error('User attempted to do something useful');
    }
};
